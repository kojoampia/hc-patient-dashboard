import {
  entityTableSelector,
  entityDetailsButtonSelector,
  entityDetailsBackButtonSelector,
  entityCreateButtonSelector,
  entityCreateSaveButtonSelector,
  entityCreateCancelButtonSelector,
  entityEditButtonSelector,
  entityDeleteButtonSelector,
  entityConfirmDeleteButtonSelector,
} from '../../support/entity';

describe('ActivityLog e2e test', () => {
  const activityLogPageUrl = '/activity-log';
  const activityLogPageUrlPattern = new RegExp('/activity-log(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const activityLogSample = {};

  let activityLog;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/patientms/api/activity-logs+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/patientms/api/activity-logs').as('postEntityRequest');
    cy.intercept('DELETE', '/services/patientms/api/activity-logs/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (activityLog) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/patientms/api/activity-logs/${activityLog.id}`,
      }).then(() => {
        activityLog = undefined;
      });
    }
  });

  it('ActivityLogs menu should load ActivityLogs page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('activity-log');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('ActivityLog').should('exist');
    cy.url().should('match', activityLogPageUrlPattern);
  });

  describe('ActivityLog page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(activityLogPageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create ActivityLog page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/activity-log/new$'));
        cy.getEntityCreateUpdateHeading('ActivityLog');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', activityLogPageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/patientms/api/activity-logs',
          body: activityLogSample,
        }).then(({ body }) => {
          activityLog = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/patientms/api/activity-logs+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              headers: {
                link: '<http://localhost/services/patientms/api/activity-logs?page=0&size=20>; rel="last",<http://localhost/services/patientms/api/activity-logs?page=0&size=20>; rel="first"',
              },
              body: [activityLog],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(activityLogPageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details ActivityLog page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('activityLog');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', activityLogPageUrlPattern);
      });

      it('edit button click should load edit ActivityLog page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('ActivityLog');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', activityLogPageUrlPattern);
      });

      it('edit button click should load edit ActivityLog page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('ActivityLog');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', activityLogPageUrlPattern);
      });

      it('last delete button click should delete instance of ActivityLog', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('activityLog').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', activityLogPageUrlPattern);

        activityLog = undefined;
      });
    });
  });

  describe('new ActivityLog page', () => {
    beforeEach(() => {
      cy.visit(`${activityLogPageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('ActivityLog');
    });

    it('should create an instance of ActivityLog', () => {
      cy.get(`[data-cy="patientId"]`).type('yuck since');
      cy.get(`[data-cy="patientId"]`).should('have.value', 'yuck since');

      cy.get(`[data-cy="caseId"]`).type('backdate highly');
      cy.get(`[data-cy="caseId"]`).should('have.value', 'backdate highly');

      cy.get(`[data-cy="loggedAt"]`).type('2026-08-02T17:37');
      cy.get(`[data-cy="loggedAt"]`).blur();
      cy.get(`[data-cy="loggedAt"]`).should('have.value', '2026-08-02T17:37');

      cy.get(`[data-cy="summary"]`).type('revolving');
      cy.get(`[data-cy="summary"]`).should('have.value', 'revolving');

      cy.get(`[data-cy="detail"]`).type('arch though');
      cy.get(`[data-cy="detail"]`).should('have.value', 'arch though');

      cy.get(`[data-cy="kind"]`).select('VISIT');

      cy.get(`[data-cy="source"]`).select('PROFESSIONAL');

      cy.get(`[data-cy="authorId"]`).type('wise following oh');
      cy.get(`[data-cy="authorId"]`).should('have.value', 'wise following oh');

      cy.get(`[data-cy="createdDate"]`).type('2026-08-02');
      cy.get(`[data-cy="createdDate"]`).blur();
      cy.get(`[data-cy="createdDate"]`).should('have.value', '2026-08-02');

      cy.get(`[data-cy="createdBy"]`).type('lest');
      cy.get(`[data-cy="createdBy"]`).should('have.value', 'lest');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(201);
        activityLog = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(200);
      });
      cy.url().should('match', activityLogPageUrlPattern);
    });
  });
});
