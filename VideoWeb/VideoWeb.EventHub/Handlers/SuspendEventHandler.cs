using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Handlers
{
    public class SuspendEventHandler : EventHandlerBase
    {
        public SuspendEventHandler(IHubContext<Hub.EventHub, IEventHubClient> hubContext) : base(hubContext)
        {
        }

        public override EventType EventType => EventType.Suspend;

        protected override async Task PublishStatusAsync(CallbackEvent callbackEvent)
        {
            var conferenceState = ConferenceState.Suspended;
            await PublishConferenceStatusMessage(conferenceState);
        }
    }
}