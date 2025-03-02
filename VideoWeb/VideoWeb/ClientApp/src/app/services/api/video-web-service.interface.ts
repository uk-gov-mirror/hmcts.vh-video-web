import { Observable } from 'rxjs';
import {
    AddMediaEventRequest,
    AddSelfTestFailureEventRequest,
    ChatResponse,
    ConferenceEventRequest,
    ConferenceForIndividualResponse,
    ConferenceForJudgeResponse,
    ConferenceResponse,
    SelfTestPexipResponse,
    TestCallScoreResponse,
    TokenResponse,
    UpdateParticipantDisplayNameRequest,
    UpdateParticipantStatusEventRequest,
    JudgeNameListResponse,
    ParticipantForUserResponse,
    VideoEndpointResponse
} from '../clients/api-client';
export interface IVideoWebApiService {
    getConferencesForJudge(): Observable<ConferenceForJudgeResponse[]>;
    getConferencesForIndividual(): Observable<ConferenceForIndividualResponse[]>;
    getConferenceById(conferenceId: string): Promise<ConferenceResponse>;
    sendEvent(request: ConferenceEventRequest): Promise<void>;
    raiseMediaEvent(conferenceId: string, addMediaEventRequest: AddMediaEventRequest): Promise<void>;
    getTestCallScore(conferenceId: string, participantId: string): Promise<TestCallScoreResponse>;
    getIndependentTestCallScore(participantId: string): Promise<TestCallScoreResponse>;
    getSelfTestToken(participantId: string): Promise<TokenResponse>;
    getJwToken(participantId: string): Promise<TokenResponse>;
    raiseParticipantEvent(conferenceId: string, updateParticipantStatusEventRequest: UpdateParticipantStatusEventRequest): Promise<void>;
    raiseSelfTestFailureEvent(conferenceId: string, addSelfTestFailureEventRequest: AddSelfTestFailureEventRequest): Promise<void>;
    getPexipConfig(): Promise<SelfTestPexipResponse>;
    getObfuscatedName(displayName: string): string;
    getConferenceChatHistory(conferenceId: string, participantId: string): Promise<ChatResponse[]>;
    updateParticipantDetails(conferenceId: string, participantId: string, updateParticipantRequest: UpdateParticipantDisplayNameRequest);
    getDistinctJudgeNames(): Promise<JudgeNameListResponse>;
    getParticipantsByConferenceId(conferenceId: string): Promise<ParticipantForUserResponse[]>;
    getEndpointsForConference(conferenceId: string): Promise<VideoEndpointResponse[]>;
}
