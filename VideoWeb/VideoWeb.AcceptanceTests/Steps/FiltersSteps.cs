using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using VideoWeb.Common.Models;
using TestApi.Contract.Dtos;
using RoomType = VideoWeb.Common.Models.RoomType;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class FiltersSteps
    {
        private readonly TestContext _c;
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly HearingAlertsSteps _alertsSteps;
        public FiltersSteps(TestContext c, HearingAlertsSteps alertsSteps, Dictionary<UserDto, UserBrowser> browsers)
        {
            _c = c;
            _alertsSteps = alertsSteps;
            _browsers = browsers;
        }

        [Given(@"the hearing has every type of alert")]
        public void GivenTheHearingHasEveryTypeOfAlert()
        {
            var participant = GetUserFromConferenceDetails("Individual");
            _alertsSteps.WhenTheTheHearingIsSuspended();
            _alertsSteps.WhenAParticipantHasDisconnectedFromTheHearing(participant.Id.ToString(), RoomType.WaitingRoom);
            _alertsSteps.WhenAParticipantHasChosenToBlockUserMedia();
            _alertsSteps.WhenAParticipantHasFailedTheSelfTestWithReason("Failed self-test (Camera)");
        }

        private ParticipantDetailsResponse GetUserFromConferenceDetails(string userRole)
        {
            var participantUser = userRole.ToLower().Equals("judge") || userRole.ToLower().Equals("Judge")
                ? _c.Test.ConferenceParticipants.Find(x => x.UserRole.ToString().Equals(Role.Judge.ToString()))
                : _c.Test.ConferenceParticipants.Find(x => x.UserRole.ToString().Equals(Role.Individual.ToString()));
            return participantUser;
        }

        [When(@"the VHO filters the hearings for both Judges")]
        public void WhenTheVHOSelectsTheHearingsForBothJudges()
        {
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.FiltersButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(FiltersPopupPage.FiltersPopup).Displayed.Should().BeTrue();
            ClickSelectAll();

            var judges = _c.Test.Conferences.Select(conference => conference.Participants.First(x => x.UserRole == UserRole.Judge).LastName).ToList();

            foreach (var judge in judges)
            {
                _browsers[_c.CurrentUser].ClickCheckbox(FiltersPopupPage.CheckBox(judge));
            }

            _browsers[_c.CurrentUser].Click(FiltersPopupPage.ApplyButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(FiltersPopupPage.FiltersPopup).Should().BeTrue();
            _browsers[_c.CurrentUser].Refresh();
        }

        [When(@"the VHO filters by the second Judge")]
        public void WhenTheVHOFiltersByTheFirstJudge()
        {
            _browsers[_c.CurrentUser].Click(VhoHearingListPage.FiltersButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(FiltersPopupPage.FiltersPopup).Displayed.Should().BeTrue();
            ClickSelectAll();
            ClickSelectAll(); // Clicking 'Select All' twice will remove any previous selections

            var judge = _c.Test.Conferences.Last().Participants.First(x => x.UserRole == UserRole.Judge).LastName;
            _browsers[_c.CurrentUser].ClickCheckbox(FiltersPopupPage.CheckBox(judge));
            _browsers[_c.CurrentUser].Click(FiltersPopupPage.ApplyButton);
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(FiltersPopupPage.FiltersPopup).Should().BeTrue();
            _browsers[_c.CurrentUser].Refresh();
        }

        private void ClickSelectAll()
        {
            var selectAllCount = _browsers[_c.CurrentUser].Driver.FindElements(FiltersPopupPage.SelectAllCheckboxes).Count;

            for (var i = 1; i <= selectAllCount; i++)
            {
                _browsers[_c.CurrentUser].ClickCheckbox(FiltersPopupPage.SelectAllCheckbox(i));
            }
        }

        [Then(@"the hearings are filtered")]
        public void ThenTheHearingsAreFiltered()
        {
            var hearingThatShouldNotBeVisible = _c.Test.Conferences.First();
            var hearingThatShouldBeVisible = _c.Test.Conferences.Last();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.CaseName(hearingThatShouldBeVisible.Id)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilElementNotVisible(VhoHearingListPage.CaseName(hearingThatShouldNotBeVisible.Id)).Should().BeTrue();
        }
        
        [Then(@"both hearings are visible")]
        public void ThenBothHearingsAreVisible()
        {
            var firstHearingThatShouldBeVisible = _c.Test.Conferences.First();
            var secondHearingThatShouldBeVisible = _c.Test.Conferences.Last();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.CaseName(firstHearingThatShouldBeVisible.Id)).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoHearingListPage.CaseName(secondHearingThatShouldBeVisible.Id)).Displayed.Should().BeTrue();
        }
    }
}
