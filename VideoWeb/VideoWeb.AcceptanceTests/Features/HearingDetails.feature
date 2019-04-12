﻿@VIH-4035
Feature: Hearing Details
	As a registered video hearings user
	I would like to login and access the hearing details
	So that I can have an overview of all the scheduled hearings I am involved in

@smoketest
Scenario: Individual has 1 or more hearings
	Given I have a hearing and a conference
	And the login page is open
	When the Individual attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the user can see a list of hearings including the new hearing
	And contact us details are available
	When the user clicks on the Start Hearing button
	Then the user is on the Equipment Check page

@smoketest
Scenario: Representative has 1 or more hearings
	Given I have a hearing and a conference
	And the login page is open
	When the Representative attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the user can see a list of hearings including the new hearing
	And contact us details are available
	When the user clicks on the Start Hearing button
	Then the user is on the Equipment Check page

Scenario: Individual has a hearing more than 30 minutes in the future
	Given I have a hearing and a conference in 31 minutes time
	And the login page is open
	When the Individual attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the new hearing isn't available to join yet
	And when the hearing is ready to start the hearing button appears
	When the user clicks on the Start Hearing button
	Then the user is on the Equipment Check page

Scenario: Representative has a hearing more than 30 minutes in the future
	Given I have a hearing and a conference in 31 minutes time
	And the login page is open
	When the Representative attempts to login with valid credentials
	Then the user is on the Hearings List page
	And the new hearing isn't available to join yet
	And when the hearing is ready to start the hearing button appears
	When the user clicks on the Start Hearing button
	Then the user is on the Equipment Check page

@smoketest
Scenario: Individual has no hearings
	Given the login page is open
	When the Individual with no hearings attempts to login with valid credentials
	Then the user is on the Hearings List page
	And a warning message appears indicating the user has no hearings scheduled
	And contact us details are available

@smoketest
Scenario: Representative has no hearings
	Given the login page is open
	When the Representative with no hearings attempts to login with valid credentials
	Then the user is on the Hearings List page
	And a warning message appears indicating the user has no hearings scheduled
	And contact us details are available