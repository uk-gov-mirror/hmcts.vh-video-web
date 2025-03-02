using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Requests;
using EventType = VideoWeb.EventHub.Enums.EventType;

namespace VideoWeb.Mappings
{
    public class CallbackEventMapper : IMapTo<ConferenceEventRequest, Conference, CallbackEvent>
    {
        public CallbackEvent Map(ConferenceEventRequest request, Conference conference)
        {
            request.EventType = request.EventType switch
            {
                VideoApi.Contract.Enums.EventType.RoomParticipantJoined => VideoApi.Contract.Enums.EventType.Joined,
                VideoApi.Contract.Enums.EventType.RoomParticipantDisconnected => VideoApi.Contract.Enums.EventType
                    .Disconnected,
                VideoApi.Contract.Enums.EventType.RoomParticipantTransfer => VideoApi.Contract.Enums.EventType.Transfer,
                _ => request.EventType
            };
            var eventType = Enum.Parse<EventType>(request.EventType.ToString());
            var conferenceId = Guid.Parse(request.ConferenceId);
            Guid.TryParse(request.ParticipantId, out var participantId);
            
            var callbackEvent = new CallbackEvent
            {
                EventId = request.EventId,
                EventType = eventType,
                ConferenceId = conferenceId,
                Reason = request.Reason,
                TransferTo = request.TransferTo,
                TransferFrom = request.TransferFrom,
                TimeStampUtc = request.TimeStampUtc,
                ParticipantId = participantId
            };
            
            if (IsEndpointJoined(callbackEvent, conference))
            {
                callbackEvent.EventType = EventType.EndpointJoined;
            }

            if (IsEndpointDisconnected(callbackEvent, conference))
            {
                callbackEvent.EventType = EventType.EndpointDisconnected;
            }
            
            if (IsEndpointTransferred(callbackEvent, conference))
            {
                callbackEvent.EventType = EventType.EndpointTransfer;
            }

            return callbackEvent;
        }

        private bool IsEndpointJoined(CallbackEvent callbackEvent, Conference conference)
        {
            return callbackEvent.EventType == EventType.Joined &&
                   conference.Endpoints.Any(x => x.Id == callbackEvent.ParticipantId);
        }
        
        private bool IsEndpointDisconnected(CallbackEvent callbackEvent, Conference conference)
        {
            return callbackEvent.EventType == EventType.Disconnected &&
                   conference.Endpoints.Any(x => x.Id == callbackEvent.ParticipantId);
        }
        
        private bool IsEndpointTransferred(CallbackEvent callbackEvent, Conference conference)
        {
            return callbackEvent.EventType == EventType.Transfer &&
                   conference.Endpoints.Any(x => x.Id == callbackEvent.ParticipantId);
        }
    }
}
