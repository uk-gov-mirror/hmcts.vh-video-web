using System;

namespace VideoWeb.Contract.Responses
{
    public class ParticipantForUserResponse
    {
        public string Username { get; set; }
        public string DisplayName { get; set; }
        public ParticipantStatus Status { get; set; }
    }
}