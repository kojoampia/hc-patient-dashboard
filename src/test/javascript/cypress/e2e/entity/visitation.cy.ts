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

describe('Visitation e2e test', () => {
  const visitationPageUrl = '/visitation';
  const visitationPageUrlPattern = new RegExp('/visitation(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const visitationSample = {};

  let visitation;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/patientms/api/visitations+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/patientms/api/visitations').as('postEntityRequest');
    cy.intercept('DELETE', '/services/patientms/api/visitations/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (visitation) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/patientms/api/visitations/${visitation.id}`,
      }).then(() => {
        visitation = undefined;
      });
    }
  });

  it('Visitations menu should load Visitations page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('visitation');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Visitation').should('exist');
    cy.url().should('match', visitationPageUrlPattern);
  });

  describe('Visitation page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(visitationPageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Visitation page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/visitation/new$'));
        cy.getEntityCreateUpdateHeading('Visitation');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', visitationPageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/patientms/api/visitations',
          body: visitationSample,
        }).then(({ body }) => {
          visitation = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/patientms/api/visitations+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              headers: {
                link: '<http://localhost/services/patientms/api/visitations?page=0&size=20>; rel="last",<http://localhost/services/patientms/api/visitations?page=0&size=20>; rel="first"',
              },
              body: [visitation],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(visitationPageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details Visitation page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('visitation');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', visitationPageUrlPattern);
      });

      it('edit button click should load edit Visitation page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Visitation');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', visitationPageUrlPattern);
      });

      it('edit button click should load edit Visitation page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Visitation');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', visitationPageUrlPattern);
      });

      it('last delete button click should delete instance of Visitation', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('visitation').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', visitationPageUrlPattern);

        visitation = undefined;
      });
    });
  });

  describe('new Visitation page', () => {
    beforeEach(() => {
      cy.visit(`${visitationPageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Visitation');
    });

    it('should create an instance of Visitation', () => {
      cy.get(`[data-cy="patientId"]`).type('refectory');
      cy.get(`[data-cy="patientId"]`).should('have.value', 'refectory');

      cy.get(`[data-cy="caseId"]`).type('yahoo inside');
      cy.get(`[data-cy="caseId"]`).should('have.value', 'yahoo inside');

      cy.get(`[data-cy="professionalId"]`).type('until monumental till');
      cy.get(`[data-cy="professionalId"]`).should('have.value', 'until monumental till');

      cy.get(`[data-cy="visitedAt"]`).type('2026-08-03T08:34');
      cy.get(`[data-cy="visitedAt"]`).blur();
      cy.get(`[data-cy="visitedAt"]`).should('have.value', '2026-08-03T08:34');

      cy.get(`[data-cy="purpose"]`).type('near um psst');
      cy.get(`[data-cy="purpose"]`).should('have.value', 'near um psst');

      cy.get(`[data-cy="location"]`).type('ferociously slight yet');
      cy.get(`[data-cy="location"]`).should('have.value', 'ferociously slight yet');

      cy.get(`[data-cy="notes"]`).type('drafty rarely');
      cy.get(`[data-cy="notes"]`).should('have.value', 'drafty rarely');

      cy.get(`[data-cy="createdDate"]`).type('2026-08-02');
      cy.get(`[data-cy="createdDate"]`).blur();
      cy.get(`[data-cy="createdDate"]`).should('have.value', '2026-08-02');

      cy.get(`[data-cy="modifiedDate"]`).type('2026-08-03');
      cy.get(`[data-cy="modifiedDate"]`).blur();
      cy.get(`[data-cy="modifiedDate"]`).should('have.value', '2026-08-03');

      cy.get(`[data-cy="createdBy"]`).type('organise');
      cy.get(`[data-cy="createdBy"]`).should('have.value', 'organise');

      cy.get(`[data-cy="modifiedBy"]`).type('goad');
      cy.get(`[data-cy="modifiedBy"]`).should('have.value', 'goad');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(201);
        visitation = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(200);
      });
      cy.url().should('match', visitationPageUrlPattern);
    });
  });
});
