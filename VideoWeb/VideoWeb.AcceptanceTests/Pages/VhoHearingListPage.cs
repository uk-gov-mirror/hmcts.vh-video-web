using System;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class VhoHearingListPage
    {
        public static By VideoHearingsCaseName(Guid conferenceId) => By.Id($"{conferenceId:D}-case-name");
        public static By VideoHearingsCaseNumbers = By.XPath("//*[contains(@id, 'case-number')]");
        public static By VideoHearingsOfficerTime(Guid conferenceId) => By.Id($"{conferenceId}-time");
        public static By VideoHearingsOfficerListedFor(Guid conferenceId) => By.Id($"{conferenceId}-duration");
        public static By VideoHearingsOfficerNumberOfAlerts(Guid conferenceId) => By.Id($"{conferenceId:D}--pending-tasks");
        public static By HearingStatusBadge(Guid conferenceId) => By.Id($"{conferenceId:D}-status");
        public static By UnreadMessagesBadge(Guid conferenceId) => By.Id($"{conferenceId:D}-unread-messages");
        public static By VideoHearingsOfficerSelectHearingButton(Guid conferenceId) => By.Id($"{conferenceId}-summary");
        public static By VhoHearingRows = By.XPath("//div[contains(@class,'govuk-summary-list__row')]");
        public static By FilterButton = By.Id("filterButton");
    }
}
