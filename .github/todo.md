# **Patient System \- Developer Checklist**

## **Phase 1: Microservice Infrastructure (patient-service)**

* \[ \] **Project Initialization**  
  * \[ \] Bootstrap Spring Boot 4 application (Java 25).  
  * \[ \] Configure pom.xml with dependencies: Spring Web, Spring Data JPA, PostgreSQL Driver, Validation, Lombok, Actuator, Spring Cloud Stream/Kafka.  
* \[ \] **Containerization**  
  * \[ \] Create docker-compose.yml.  
  * \[ \] Configure patient\_db (PostgreSQL) container with health checks.  
  * \[ \] Configure telemetry\_db (TimescaleDB) container.  
* \[ \] **Global Configuration**  
  * \[ \] Create GlobalExceptionHandler with @ControllerAdvice.  
  * \[ \] Implement handlers for EntityNotFoundException, MethodArgumentNotValidException, and Exception.  
  * \[ \] Ensure responses conform to RFC 7807 Problem Details.  
  * \[ \] Write @WebMvcTest to verify exception handling.

## **Phase 2: Domain & Data Layer**

* \[ \] **Core Entities**  
  * \[ \] Create BaseEntity (@MappedSuperclass, UUID id, createdAt, updatedAt with JPA Auditing).  
  * \[ \] Create PatientProfile entity (Name, Mobile, Email, Address, ID Type, ID Number).  
  * \[ \] Create SubscriptionPlan entity (Name, Price, Visits, Included Services).  
  * \[ \] Create PatientSubscription entity mapping profile to plan.  
* \[ \] **Database Migrations**  
  * \[ \] Configure Liquibase (or Flyway).  
  * \[ \] Write migration script to generate schema.  
  * \[ \] Write seed script for default plans: Pear (1000), Melon (2000), Pawpaw (5000).  
* \[ \] **Telemetry Ingestion**  
  * \[ \] Create VitalStatistic entity optimized for TimescaleDB.  
  * \[ \] Create TelemetryService to handle incoming vital readings.  
* \[ \] **Event Driven/Kafka**  
  * \[ \] Configure Kafka Producer.  
  * \[ \] Implement logic to publish IoTDataReceivedEvent to the raw-telemetry topic when a new vital stat is saved.

## **Phase 3: Mobile Frontend (Ionic \+ Angular 19\)**

* \[ \] **Workspace Setup**  
  * \[ \] Initialize Angular 19+ standalone workspace.  
  * \[ \] Integrate Ionic Framework dependencies.  
  * \[ \] Create standard folder structure (core/, shared/, features/).  
* \[ \] **Core Services & State**  
  * \[ \] Create AuthService using Angular Signals (currentUser, isAuthenticated).  
  * \[ \] Create HTTP Interceptor for automatic JWT token injection.  
* \[ \] **Onboarding Flow**  
  * \[ \] Build Step 1 component: Basic Info (Reactive Forms \+ Validators).  
  * \[ \] Build Step 2 component: Identification upload/details.  
  * \[ \] Build Step 3 component: Plan Selection (Pear, Melon, Pawpaw cards).  
  * \[ \] Implement form state management across steps using Signals.  
  * \[ \] Write submission function to send unified DTO to backend.  
* \[ \] **Patient Dashboard UI**  
  * \[ \] Build tabbed Ionic navigation shell.  
  * \[ \] Implement **User Account** tab (Profile view/edit).  
  * \[ \] Implement **Dashboard** tab (Read-only historical telemetry logs).  
  * \[ \] Implement **Calendar** tab (Upcoming visit schedules).  
  * \[ \] Implement **Professionals** tab (Assigned caregiver directory).  
  * \[ \] Implement **Share Records** tab (Time-bound data sharing toggles).