﻿using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class HearingListPage
    {
        public HearingListPage()
        {
        }

        public By NoHearingsWarningMessage => CommonLocators.ElementContainingText("You have no video hearings");
        public By _hearingWithCaseNumber(string caseNumber) => CommonLocators.ElementContainingText(caseNumber);
        public By _waitToSignInText(string caseNumber) => By.XPath($"//tr//*[contains(text(),'{caseNumber}')]/../../td/p[contains(text(),'Sign in Today')]");
        public By _signInButton(string caseNumber) => By.XPath($"//tr//*[contains(text(),'{caseNumber}')]/../../td/input[@role='button' and @value='Sign into hearing']");        
        public By _startHearingButton(string caseNumber) => By.XPath($"//tr//*[contains(text(),'{caseNumber}')]/../../..//input[@role='button' and @value='Start hearing']");

        public By ParticipantHearingDate(string caseNumber) => By.XPath($"//strong[contains(text(),'{caseNumber}')]/../../td[contains(text(),'20')]");

        public By JudgeHearingDate(string caseNumber) =>
            By.XPath($"//strong[contains(text(),'{caseNumber}')]/../../../td/span[contains(text(),'listed for')]/..");

        public By CaseType(string caseNumber, string caseType) =>
            By.XPath($"//strong[contains(text(),'{caseNumber}')]/../../p[contains(text(),'{caseType}')]");

        public By ParticipantsStatus(string caseNumber) =>
            By.XPath($"//strong[contains(text(),'{caseNumber}')]/../../../td/p[contains(text(),'Available')]");
    }
}
