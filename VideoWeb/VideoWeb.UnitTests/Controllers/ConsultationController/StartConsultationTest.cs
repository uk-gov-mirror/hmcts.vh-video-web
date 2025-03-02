using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Requests;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Requests;
using VideoWeb.Helpers;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class StartConsultationTest
    {
        private AutoMock _mocker;
        private ConsultationsController _controller;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();

            _testConference = ConsultationHelper.BuildConferenceForTest();

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<StartPrivateConsultationRequest, StartConsultationRequest>()).Returns(_mocker.Create<StartPrivateConsultationRequestMapper>());

            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(_testConference.Id,
                        It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);

            _mocker.Mock<IHubClients<IEventHubClient>>().Setup(x => x.Group(It.IsAny<string>())).Returns(_mocker.Mock<IEventHubClient>().Object);
            _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>().Setup(x => x.Clients).Returns(_mocker.Mock<IHubClients<IEventHubClient>>().Object);

            _controller = _mocker.Create<ConsultationsController>();
            _controller.ControllerContext = context;
        }

        [Test]
        public async Task Should_return_participant_not_found_when_request_is_sent()
        {
            var conference = new Conference { Id = Guid.NewGuid() };
            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            var consultationRequest = Builder<StartPrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conference.Id).Build();
            var result = await _controller.StartConsultationAsync(consultationRequest);

            var typedResult = (NotFoundResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_accepted_when_request_is_sent()
        {
            // Arrange
            var request = ConsultationHelper.GetStartJohConsultationRequest(_testConference);

            // Act
            var result = await _controller.StartConsultationAsync(request);

            // Assert
            result.Should().BeOfType<AcceptedResult>();
            _mocker.Mock<IVideoApiClient>()
                .Verify(x => x.StartPrivateConsultationAsync(It.IsAny<StartConsultationRequest>()), Times.Once);
        }

        [Test]
        public async Task Should_return_accepted_when_request_is_sent_participant_room_type()
        {
            // Arrange
            var request = ConsultationHelper.GetStartParticipantConsultationRequest(_testConference);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.CreatePrivateConsultationAsync(It.IsAny<StartConsultationRequest>()))
                .ReturnsAsync(new RoomResponse {Label = "Room1", Locked = false});

            // Act
            var result = await _controller.StartConsultationAsync(request);

            // Assert
            result.Should().BeOfType<AcceptedResult>();
            _mocker.Mock<IVideoApiClient>()
                .Verify(x => x.CreatePrivateConsultationAsync(It.IsAny<StartConsultationRequest>()), Times.Once);

            _mocker.Mock<IConsultationNotifier>()
                .Verify(
                    x => x.NotifyRoomUpdateAsync(_testConference, It.Is<Room>(r =>
                        r.ConferenceId == _testConference.Id && r.Label == "Room1" && !r.Locked)), Times.Once);

            _mocker.Mock<IConsultationNotifier>()
                .Verify(
                    x => x.NotifyConsultationRequestAsync(_testConference, "Room1", request.RequestedBy,
                        It.IsIn(request.InviteParticipants)), Times.Exactly(request.InviteParticipants.Length));
        }

        [Test]
        public async Task Should_only_join_first_successful_endpoint()
        {
            // Arrange
            var request = ConsultationHelper.GetStartParticipantConsultationRequest(_testConference);
            request.InviteEndpoints = new[]
            {
                _testConference.Endpoints[0].Id, // Wrong defense advocate username
                _testConference.Endpoints[1].Id, // Valid
                _testConference.Endpoints[2].Id
            }; // Shouldnt try
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.CreatePrivateConsultationAsync(It.IsAny<StartConsultationRequest>()))
                .ReturnsAsync(new RoomResponse {Label = "Room1", Locked = false});

            // Act
            var result = await _controller.StartConsultationAsync(request);

            // Assert
            result.Should().BeOfType<AcceptedResult>();
            _mocker.Mock<IVideoApiClient>()
                .Verify(x => x.CreatePrivateConsultationAsync(It.IsAny<StartConsultationRequest>()), Times.Once);
            
            _mocker.Mock<IConsultationNotifier>()
                .Verify(
                    x => x.NotifyRoomUpdateAsync(_testConference, It.Is<Room>(r =>
                        r.ConferenceId == _testConference.Id && r.Label == "Room1" && !r.Locked)), Times.Once);
            
            _mocker.Mock<IConsultationNotifier>()
                .Verify(
                    x => x.NotifyConsultationRequestAsync(_testConference, "Room1", request.RequestedBy,
                        It.IsIn(request.InviteParticipants)), Times.Exactly(request.InviteParticipants.Length));
            
            _mocker.Mock<IVideoApiClient>()
                .Verify(
                    x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(ecr =>
                        request.InviteEndpoints.Contains(ecr.EndpointId) && ecr.ConferenceId == _testConference.Id &&
                        ecr.RequestedById == request.RequestedBy)), Times.Once);
        }

        [Test]
        public async Task Should_only_join_first_successful_endpoint_first_fail()
        {
            // Arrange
            var request = ConsultationHelper.GetStartParticipantConsultationRequest(_testConference);
            request.InviteEndpoints = new[] { 
                _testConference.Endpoints[0].Id, // Wrong defense advocate username
                _testConference.Endpoints[1].Id, // Valid but mocked to throw
                _testConference.Endpoints[2].Id }; // Valid
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.CreatePrivateConsultationAsync(It.IsAny<StartConsultationRequest>())).ReturnsAsync(new RoomResponse { Label = "Room1", Locked = false });
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(ecr => ecr.EndpointId == request.InviteEndpoints[1] && ecr.ConferenceId == _testConference.Id && ecr.RequestedById == request.RequestedBy)))
                .Throws(apiException);

            // Act
            var result = await _controller.StartConsultationAsync(request);

            // Assert
            result.Should().BeOfType<AcceptedResult>();
            _mocker.Mock<IVideoApiClient>()
                .Verify(x => x.CreatePrivateConsultationAsync(It.IsAny<StartConsultationRequest>()), Times.Once);
            
            _mocker.Mock<IConsultationNotifier>()
                .Verify(
                    x => x.NotifyRoomUpdateAsync(_testConference, It.Is<Room>(r =>
                        r.ConferenceId == _testConference.Id && r.Label == "Room1" && !r.Locked)), Times.Once);
            
            _mocker.Mock<IConsultationNotifier>()
                .Verify(
                    x => x.NotifyConsultationRequestAsync(_testConference, "Room1", request.RequestedBy,
                        It.IsIn(request.InviteParticipants)), Times.Exactly(request.InviteParticipants.Length));
            
            _mocker.Mock<IVideoApiClient>()
                .Verify(x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(ecr => request.InviteEndpoints.Contains(ecr.EndpointId) && ecr.ConferenceId == _testConference.Id && ecr.RequestedById == request.RequestedBy)), Times.Exactly(2));
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "{\"ConsultationRoom\":[\"No consultation room available\"]}", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.StartPrivateConsultationAsync(It.IsAny<StartConsultationRequest>()))
                .ThrowsAsync(apiException);

            var result =
                await _controller.StartConsultationAsync(
                    ConsultationHelper.GetStartJohConsultationRequest(_testConference));

            var typedResult = (StatusCodeResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException("Internal Server Error",
                (int)HttpStatusCode.InternalServerError, "The server collapse due to unhandled error", default, null);

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.StartPrivateConsultationAsync(It.IsAny<StartConsultationRequest>()))
                .ThrowsAsync(apiException);

            var result =
                await _controller.StartConsultationAsync(
                    ConsultationHelper.GetStartJohConsultationRequest(_testConference));
            var typedResult = (StatusCodeResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
        }
    }
}
