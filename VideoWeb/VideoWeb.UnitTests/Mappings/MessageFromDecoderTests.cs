using System;
using System.Linq;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Helpers;
using UserApi.Client;
using UserApi.Contract.Responses;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Enums;

namespace VideoWeb.UnitTests.Mappings
{
    public class MessageFromDecoderTests
    {
        private Mock<IUserApiClient> _userApiClientMock;
        private MessageFromDecoder _decoder;
        private DictionaryUserCache _userCache;

        [SetUp]
        public void Setup()
        {
            _userCache = new DictionaryUserCache();
            _userApiClientMock = new Mock<IUserApiClient>();
            _decoder = new MessageFromDecoder(_userApiClientMock.Object, _userCache);
        }

        [Test]
        public void Should_return_true_when_message_is_from_provided_username()
        {
            var loggedInUsername = "john@hmcts.net";

            var message = new InstantMessageResponse
            {
                From = loggedInUsername, MessageText = "test", TimeStamp = DateTime.UtcNow
            };
            var result = _decoder.IsMessageFromUser(message, loggedInUsername);
            result.Should().BeTrue();
        }

        [Test]
        public void Should_return_false_when_message_is_from_another_user()
        {
            var loggedInUsername = "john@hmcts.net";
            var otherUsername = "someone@else.com";

            var message = new InstantMessageResponse
            {
                From = otherUsername, MessageText = "test", TimeStamp = DateTime.UtcNow
            };
            var result = _decoder.IsMessageFromUser(message, loggedInUsername);
            result.Should().BeFalse();
        }

        [Test]
        public async Task Should_get_participant_display_name_when_message_from_participant_in_conference()
        {
            const string loggedInUsername = "john@hmcts.net";
            const string displayName = "johnny";
            var conference = CreateConferenceResponse(loggedInUsername, displayName);

            var message = new InstantMessageResponse
            {
                From = loggedInUsername, MessageText = "test", TimeStamp = DateTime.UtcNow
            };

            var result = await _decoder.GetMessageOriginatorAsync(conference, message);
            result.Should().BeEquivalentTo(displayName);
        }

        [Test]
        public async Task Should_get_first_name_from_ad_when_message_from_non_participant()
        {
            var nonParticipantUsername = "someone@else.com";
            var userProfile = new UserProfile
            {
                FirstName = "Someone",
                LastName = "Else",
                UserName = nonParticipantUsername,
                DisplayName = "Some other user display",
                Email = "else@someone.net",
                UserRole = UserRole.VideoHearingsOfficer.ToString()
            };
            _userApiClientMock.Setup(x => x.GetUserByAdUserNameAsync(nonParticipantUsername)).ReturnsAsync(userProfile);

            var loggedInUsername = "john@hmcts.net";
            var displayName = "johnny";
            var conference = CreateConferenceResponse(loggedInUsername, displayName);

            var message = new InstantMessageResponse
            {
                From = nonParticipantUsername, MessageText = "test", TimeStamp = DateTime.UtcNow
            };

            var result = await _decoder.GetMessageOriginatorAsync(conference, message);
            result.Should().BeEquivalentTo(userProfile.FirstName);
        }

        private static Conference CreateConferenceResponse(string username, string displayName)
        {
            var participants = Builder<Participant>.CreateListOfSize(2)
                .TheFirst(1).With(x => x.Username = username)
                .With(x => x.DisplayName = displayName)
                .Build().ToList();

            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Participants = participants)
                .Build();

            return conference;
        }
    }
}
