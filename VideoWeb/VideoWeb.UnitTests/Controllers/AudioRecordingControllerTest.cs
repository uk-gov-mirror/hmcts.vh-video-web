using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Controllers;
using VideoApi.Client;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Controllers
{
    public class AudioRecordingControllerTest
    {
        private AudioRecordingController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<ILogger<VenuesController>> _mockLogger;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _mockLogger = new Mock<ILogger<VenuesController>>();
            _controller = new AudioRecordingController(_videoApiClientMock.Object, _mockLogger.Object);
        }

        [Test]
        public async Task Should_return_success_to_get_audio_stream_info_an_returns_status_ok()
        {

            _videoApiClientMock.Setup(x => x.GetAudioStreamInfoAsync(It.IsAny<Guid>())).ReturnsAsync(new AudioStreamInfoResponse());

            var result = await _controller.GetAudioStreamInfoAsync(Guid.NewGuid());
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(200);
        }


        [Test]
        public async Task Should_throw_exception_getting_audio_stream_info_recording()
        {
            var videoException = new VideoApiException("Error to stop audio", (int)HttpStatusCode.Conflict, "Error", null, null);

            _videoApiClientMock.Setup(x => x.GetAudioStreamInfoAsync(It.IsAny<Guid>())).ThrowsAsync(videoException);

            var result = await _controller.GetAudioStreamInfoAsync(Guid.NewGuid());
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(409);
        }

        [Test]
        public async Task Should_throw_exception_stopping_audio_recording()
        {
            var videoException = new VideoApiException("Error to stop audio", (int)HttpStatusCode.Conflict, "Error", null, null);

            _videoApiClientMock.Setup(x => x.DeleteAudioApplicationAsync(It.IsAny<Guid>())).ThrowsAsync(videoException);

            var result = await _controller.StopAudioRecordingAsync(Guid.NewGuid());
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(409);
        }
    }
}
