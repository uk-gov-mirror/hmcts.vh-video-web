using System.Linq;
using System.Net;
using Castle.Core.Internal;
using FluentAssertions;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;
using TestApi.Contract.Requests;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public class UnallocateUsersHooks
    {
        [AfterScenario]
        public void UnallocateUsers(TestContext context)
        {
            if (context?.Apis?.TestApi == null) return;
            if (context.Test.Users.IsNullOrEmpty()) return;

            var usernames = context.Test.Users.Select(user => user.Username).ToList();
            if (usernames.Count <= 0) return;

            var request = new UnallocateUsersRequest()
            {
                Usernames = usernames
            };

            var response = context.Apis.TestApi.UnallocateUsers(request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}
