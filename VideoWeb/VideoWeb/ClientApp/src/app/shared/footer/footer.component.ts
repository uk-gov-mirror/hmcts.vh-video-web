import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PageUrls } from '../page-url.constants';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  hideContactUsLink = false;
  privacyPolicyUri = PageUrls.PrivacyPolicy;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter((event: Event) => event instanceof NavigationEnd)
    ).subscribe(x => {
      this.hideContactUs();
    });
  }

  ngOnInit() {
    this.hideContactUs();
  }

  hideContactUs() {
    this.hideContactUsLink = this.router.url === '/contact-us';
  }
}






