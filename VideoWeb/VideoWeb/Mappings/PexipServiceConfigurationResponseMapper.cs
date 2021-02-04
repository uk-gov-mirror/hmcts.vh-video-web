using VideoWeb.Contract.Responses;
using VideoApi.Contract.Responses;

namespace VideoWeb.Mappings
{
    public class PexipServiceConfigurationResponseMapper : IMapTo<PexipConfigResponse, SelfTestPexipResponse>
    {
        public SelfTestPexipResponse Map(PexipConfigResponse pexipConfigResponse)
        {
            return new SelfTestPexipResponse
            {
                PexipSelfTestNode = pexipConfigResponse?.PexipSelfTestNode
            };
        }
    }
}
