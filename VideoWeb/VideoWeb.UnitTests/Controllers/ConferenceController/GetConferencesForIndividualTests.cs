using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Controllers;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using Conference = VideoApi.Contract.Responses.ConferenceForIndividualResponse;
using ConferenceForIndividualResponse = VideoWeb.Contract.Responses.ConferenceForIndividualResponse;
using Autofac.Extras.Moq;
using VideoWeb.Mappings;
using VideoWeb.Contract.Responses;

namespace VideoWeb.UnitTests.Controllers.ConferenceController
{
    public class GetConferencesForIndividualTests
    {
        private AutoMock _mocker;
        private ConferencesController _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();

            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<ParticipantResponseMapper>()
                .AddTypedParameters<EndpointsResponseMapper>()
                .AddTypedParameters<ParticipantForJudgeResponseMapper>()
                .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                .Build();

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<VideoApi.Contract.Responses.ConferenceForJudgeResponse, VideoWeb.Contract.Responses.ConferenceForJudgeResponse>()).Returns(_mocker.Create<ConferenceForJudgeResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<VideoApi.Contract.Responses.ConferenceForIndividualResponse, VideoWeb.Contract.Responses.ConferenceForIndividualResponse>()).Returns(_mocker.Create<ConferenceForIndividualResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceForAdminResponse, ConferenceForVhOfficerResponse>()).Returns(_mocker.Create<ConferenceForVhOfficerResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, ConferenceResponseVho>()).Returns(_mocker.Create<ConferenceResponseVhoMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, ConferenceResponse>()).Returns(_mocker.Create<ConferenceResponseMapper>(parameters));

            _sut = _mocker.Create<ConferencesController>();
            _sut.ControllerContext = context;
        }

        [Test]
        public async Task Should_return_ok_with_list_of_conferences()
        {
            var conferences = Builder<Conference>.CreateListOfSize(10).All()
                .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
                .Build().ToList();

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
                .ReturnsAsync(conferences);

            var result = await _sut.GetConferencesForIndividual();

            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();

            var conferencesForUser = (List<ConferenceForIndividualResponse>)typedResult.Value;
            conferencesForUser.Should().NotBeNullOrEmpty();
            conferencesForUser.Count.Should().Be(conferences.Count);
        }

        [Test]
        public async Task Should_return_ok_with_no_conferences()
        {
            var conferences = new List<Conference>();
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
                .ReturnsAsync(conferences);

            var result = await _sut.GetConferencesForIndividual();

            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();

            var conferencesForUser = (List<ConferenceForIndividualResponse>)typedResult.Value;
            conferencesForUser.Should().BeEmpty();
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid email", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _sut.GetConferencesForIndividual();

            var typedResult = (ObjectResult)result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Should_return_forbidden_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Unauthorised Token", (int)HttpStatusCode.Unauthorized,
                "Invalid Client ID", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _sut.GetConferencesForIndividual();

            var typedResult = (ObjectResult)result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized);
        }

        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
                .ThrowsAsync(apiException);

            var result = await _sut.GetConferencesForIndividual();
            var typedResult = result.Value;
            typedResult.Should().BeNull();
        }
    }
}
