# **Health Connect: Patient System Blueprint**

This blueprint focuses entirely on the Patient domain, providing the prompts necessary to build the patient-service backend and the Patient Mobile App.

## **Phase 1: Patient Microservice Infrastructure**

**Prompt 1.1: Initializing the Patient Service**

Act as an expert Java developer. Initialize a new Spring Boot 4 application using Java 26\. This will be the \`patient-service\` microservice.  
Please generate the \`pom.xml\` and main application class. Include dependencies for:   
\- Spring Web, Spring Data JPA, PostgreSQL Driver  
\- Validation, Lombok, Spring Boot Actuator  
\- Spring Cloud Stream / Spring Kafka (for emitting telemetry events)  
Create a \`docker-compose.yml\` file that spins up a PostgreSQL database named \`patient\_db\` and a TimescaleDB instance named \`telemetry\_db\`.  
Include an RFC 7807 compliant \`@ControllerAdvice\` for global exception handling.

## **Phase 2: Patient Domain & Data Layer**

**Prompt 2.1: Patient Profile & Subscription Plans**

Within the \`patient-service\`, create the JPA domain models.  
1\. Create a \`BaseEntity\` with UUID, createdAt, and updatedAt.  
2\. Create \`PatientProfile\` (First/Last Name, Mobile, Email, Long-Lat, Digital Address, Street Address, ID Type \[PASSPORT, GHANA\_CARD\], ID Number).  
3\. Create \`SubscriptionPlan\` (name \[Pear, Melon, Pawpaw\], monthlyPrice, weeklyVisits, includedServices).  
4\. Create a \`PatientSubscription\` entity mapping the patient to their active plan.  
Generate Liquibase migrations to create these tables and seed the default Pear (1000), Melon (2000), and Pawpaw (5000) plans.

**Prompt 2.2: Telemetry Ingestion (TimescaleDB)**

Implement the data ingestion layer for patient vital statistics.  
Create a \`VitalStatistic\` entity optimized for TimescaleDB (patientId, timestamp, metricType \[BP, HR, GLUCOSE\], value).   
Create a \`TelemetryService\` that saves incoming readings.   
Configure a Kafka Producer to publish an \`IoTDataReceivedEvent\` to a \`raw-telemetry\` topic whenever a new vital reading is saved, allowing other services (like the Professional service) to react to it.

## **Phase 3: Patient Mobile App (Ionic/Angular)**

**Prompt 3.1: Patient Workspace & Auth State**

Act as an expert frontend developer. Initialize a new Angular 19+ workspace strictly using Standalone Components and Signals. Integrate the Ionic Framework for the Patient Mobile App.  
Set up the \`AuthService\` using Signals to hold the \`currentUser\` (ensuring role is PATIENT or ANGEL) and an HTTP Interceptor for JWT injection.

**Prompt 3.2: Onboarding & Interrogation Flow**

Create a multi-step onboarding wizard for the Patient Mobile App using Ionic and Angular Reactive Forms.  
\- Step 1: Basic Info (Name, Mobile, Email, Address, Long-Lat).  
\- Step 2: Identification (ID Type, ID Number).  
\- Step 3: Choose Plan (Display the Pear, Melon, and Pawpaw pricing tiers).  
Implement the submission logic to send a unified DTO to the \`patient-service\`.

**Prompt 3.3: Patient Dashboard & Records**

Build the Patient Dashboard module based on the system design.  
Create a tabbed Ionic interface featuring:  
1\. \*\*User Account:\*\* Profile management.  
2\. \*\*Dashboard / View Records:\*\* Read-only view of historical telemetry and visit logs.  
3\. \*\*Calendar / View Schedules:\*\* A calendar component showing upcoming scheduled visits.  
4\. \*\*Professionals:\*\* A directory of assigned health professionals.  
5\. \*\*Share Records:\*\* A toggle interface to grant/revoke time-bound data access to external entities.  
