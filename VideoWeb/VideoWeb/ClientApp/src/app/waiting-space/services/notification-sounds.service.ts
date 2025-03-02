import { Injectable } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';

@Injectable()
export class NotificationSoundsService {
    private readonly loggerPrefix = '[NotificationSoundsService] -';
    constructor(private logger: Logger) {}

    consultationRequestSound: HTMLAudioElement;
    hearingStartingAnnounced: boolean;
    currentPlayCount: number;
    hearingAlertSound: HTMLAudioElement;

    hearingAlertPlayCount: number;

    initConsultationRequestRingtone(): void {
        this.consultationRequestSound = new Audio();
        this.consultationRequestSound.src = '/assets/audio/consultation_request.mp3';
        this.consultationRequestSound.load();
        this.consultationRequestSound.addEventListener(
            'ended',
            function () {
                this.play();
            },
            false
        );
    }

    async playConsultationRequestRingtone() {
        await this.consultationRequestSound.play().catch(err => {
            this.logger.error(`${this.loggerPrefix} failed to play consultation request ringtone`, err, {
                errorMessage: this.consultationRequestSound.error
            });
        });
    }

    stopConsultationRequestRingtone() {
        this.consultationRequestSound.pause();
        this.consultationRequestSound.currentTime = 0;
    }

    playHearingAlertSound() {
        if (!this.hearingAlertSound) {
            this.initHearingAlertSound();
        }
        if (this.hearingAlertPlayCount >= 3) {
            this.hearingAlertPlayCount = 1;
        }
        this.logger.debug(`${this.loggerPrefix} playing hearing starting sound`);
        return this.hearingAlertSound.play().catch(err => {
            this.logger.error(`${this.loggerPrefix} failed to play hearing alert sound`, err, {
                errorMessage: this.hearingAlertSound.error
            });
        });
    }

    stopHearingAlertSound() {
        this.hearingAlertSound.pause();
        this.hearingAlertSound.currentTime = 0;
        this.hearingAlertPlayCount = 1;
    }

    initHearingAlertSound() {
        this.hearingAlertPlayCount = 1;
        this.hearingAlertSound = new Audio();
        this.hearingAlertSound.src = '/assets/audio/hearing_starting_soon.mp3';
        this.hearingAlertSound.load();
        const self = this;
        this.hearingAlertSound.addEventListener(
            'ended',
            function () {
                self.hearingAlertPlayCount++;
                if (self.hearingAlertPlayCount <= 3) {
                    this.play();
                }
            },
            false
        );
    }
}
