using System.Collections.Generic;
using AcceptanceTests.Common.Driver.Drivers;
using AcceptanceTests.Common.Driver.Helpers;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.AcceptanceTests.Pages;
using TestApi.Contract.Dtos;

namespace VideoWeb.AcceptanceTests.Steps
{
    [Binding]
    public sealed class RulesSteps : ISteps
    {
        private readonly Dictionary<UserDto, UserBrowser> _browsers;
        private readonly TestContext _c;
        private readonly CommonSteps _commonSteps;

        public RulesSteps(Dictionary<UserDto, UserBrowser> browsers, TestContext testContext, CommonSteps commonSteps)
        {
            _browsers = browsers;
            _c = testContext;
            _commonSteps = commonSteps;
        }

        [Then(@"the HMCTS Crest is visible")]
        public void ThenTheHmctsCrestIsVisible()
        {
            _browsers[_c.CurrentUser].Driver.WaitUntilVisible(RulesPage.HmctsLogo).Displayed.Should().BeTrue();
        }

        public void ProgressToNextPage()
        {
            _commonSteps.WhenTheUserClicksTheButton("Continue");
        }
    }
}
