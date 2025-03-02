using System.Collections.Generic;
using System.Linq;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using AcceptanceTests.Common.Test.Helpers;
using FluentAssertions;
using OpenQA.Selenium;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;
using VideoApi.Contract.Enums;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public class VenueListSteps : ISteps
    {
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;

        public VenueListSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext testContext)
        {
            _browsers = browsers;
            _c = testContext;
        }
        
        public void ProgressToNextPage()
        {
            SelectVenues(_c.Test.Conference.Participants.First(x => x.UserRole == UserRole.Judge).FirstName);
            ConfirmVenue();
        }
        
        [When(@"the VHO selects the courtroom (.*)")]
        [When(@"the VHO selects the courtrooms (.*)")]
        [When(@"the VHO selects the hearings for a Judge named (.*)")]
        [When(@"the VHO selects the hearings for Judges named (.*)")]
        public void SelectVenues(string judgeNames)
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoVenueAllocationPage.VenuesDropdown).Displayed.Should().BeTrue();
            _browsers[_c.CurrentUser].Click(VhoVenueAllocationPage.VenuesTextBox);

            foreach (var venue in ConverterHelpers.ConvertStringIntoArray(judgeNames))
            {
                _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoVenueAllocationPage.VenuesTextBox).SendKeys(venue);
                _browsers[_c.CurrentUser].ClickCheckbox(VhoVenueAllocationPage.VenueCheckbox(venue), 5);
            }
        }

        [When(@"the VHO confirms their allocation selection")]
        public void ConfirmVenue()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(VhoVenueAllocationPage.VenuesTextBox).SendKeys(Keys.Escape);
            _browsers[_c.CurrentUser].Click(VhoVenueAllocationPage.VenueConfirmButton);
        }

        [When(@"the VHO selects all the venues")]
        public void SelectAllVenuesAndProceed()
        {
            var venues = _c.Test.Users.Where(user => user.UserType == UserType.Judge).Aggregate("", (current, user) => current + user.FirstName + ",");
            SelectVenues(venues);
            ConfirmVenue();
        }
    }
}
