﻿using System;
using OpenQA.Selenium;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public static class SaucelabsResult
    {
        public static void LogPassed(bool passed, IWebDriver driver)
        {

            try
            {
                ((IJavaScriptExecutor)driver).ExecuteScript("sauce:job-result=" + (passed ? "passed" : "failed"));
            }
            catch (Exception e)
            {
                NUnit.Framework.TestContext.WriteLine($"<{e.GetType().Name}> Failed to report test status to saucelabs: {e.Message}");
            }
        }

        public static void LogPassed(bool passed, SeleniumEnvironment environment)
        {
            try
            {
                var driver = environment.GetDriver("");
                ((IJavaScriptExecutor)driver).ExecuteScript("sauce:job-result=" + (passed ? "passed" : "failed"));
            }
            catch (Exception e)
            {
                NUnit.Framework.TestContext.WriteLine($"<{e.GetType().Name}> Failed to report test status to saucelabs: {e.Message}");
            }
        }
    }
}
