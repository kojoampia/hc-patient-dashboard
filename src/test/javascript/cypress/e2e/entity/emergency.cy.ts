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

describe('Emergency e2e test', () => {
  const emergencyPageUrl = '/emergency';
  const emergencyPageUrlPattern = new RegExp('/emergency(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const emergencySample = {};

  let emergency;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/patientms/api/emergencies+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/patientms/api/emergencies').as('postEntityRequest');
    cy.intercept('DELETE', '/services/patientms/api/emergencies/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (emergency) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/patientms/api/emergencies/${emergency.id}`,
      }).then(() => {
        emergency = undefined;
      });
    }
  });

  it('Emergencies menu should load Emergencies page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('emergency');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Emergency').should('exist');
    cy.url().should('match', emergencyPageUrlPattern);
  });

  describe('Emergency page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(emergencyPageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Emergency page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/emergency/new$'));
        cy.getEntityCreateUpdateHeading('Emergency');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', emergencyPageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/patientms/api/emergencies',
          body: emergencySample,
        }).then(({ body }) => {
          emergency = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/patientms/api/emergencies+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              body: [emergency],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(emergencyPageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details Emergency page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('emergency');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', emergencyPageUrlPattern);
      });

      it('edit button click should load edit Emergency page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Emergency');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', emergencyPageUrlPattern);
      });

      it('edit button click should load edit Emergency page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Emergency');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', emergencyPageUrlPattern);
      });

      it('last delete button click should delete instance of Emergency', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('emergency').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', emergencyPageUrlPattern);

        emergency = undefined;
      });
    });
  });

  describe('new Emergency page', () => {
    beforeEach(() => {
      cy.visit(`${emergencyPageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Emergency');
    });

    it('should create an instance of Emergency', () => {
      cy.get(`[data-cy="patientId"]`).type('duh');
      cy.get(`[data-cy="patientId"]`).should('have.value', 'duh');

      cy.get(`[data-cy="caseId"]`).type('through');
      cy.get(`[data-cy="caseId"]`).should('have.value', 'through');

      cy.get(`[data-cy="raisedAt"]`).type('2026-08-02T14:55');
      cy.get(`[data-cy="raisedAt"]`).blur();
      cy.get(`[data-cy="raisedAt"]`).should('have.value', '2026-08-02T14:55');

      cy.get(`[data-cy="resolvedAt"]`).type('2026-08-02T09:15');
      cy.get(`[data-cy="resolvedAt"]`).blur();
      cy.get(`[data-cy="resolvedAt"]`).should('have.value', '2026-08-02T09:15');

      cy.get(`[data-cy="brief"]`).type('zero pfft');
      cy.get(`[data-cy="brief"]`).should('have.value', 'zero pfft');

      cy.get(`[data-cy="detail"]`).type('lest');
      cy.get(`[data-cy="detail"]`).should('have.value', 'lest');

      cy.get(`[data-cy="severity"]`).select('HIGH');

      cy.get(`[data-cy="status"]`).select('ACKNOWLEDGED');

      cy.get(`[data-cy="outcome"]`).type('inasmuch');
      cy.get(`[data-cy="outcome"]`).should('have.value', 'inasmuch');

      cy.get(`[data-cy="location"]`).type('trance middleman but');
      cy.get(`[data-cy="location"]`).should('have.value', 'trance middleman but');

      cy.get(`[data-cy="respondentId"]`).type('crackle black-and-white viewing');
      cy.get(`[data-cy="respondentId"]`).should('have.value', 'crackle black-and-white viewing');

      cy.get(`[data-cy="createdDate"]`).type('2026-08-02');
      cy.get(`[data-cy="createdDate"]`).blur();
      cy.get(`[data-cy="createdDate"]`).should('have.value', '2026-08-02');

      cy.get(`[data-cy="modifiedDate"]`).type('2026-08-02');
      cy.get(`[data-cy="modifiedDate"]`).blur();
      cy.get(`[data-cy="modifiedDate"]`).should('have.value', '2026-08-02');

      cy.get(`[data-cy="createdBy"]`).type('when viciously');
      cy.get(`[data-cy="createdBy"]`).should('have.value', 'when viciously');

      cy.get(`[data-cy="modifiedBy"]`).type('eek lower character');
      cy.get(`[data-cy="modifiedBy"]`).should('have.value', 'eek lower character');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(201);
        emergency = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(200);
      });
      cy.url().should('match', emergencyPageUrlPattern);
    });
  });
});
