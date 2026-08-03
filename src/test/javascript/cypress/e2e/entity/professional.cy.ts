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

describe('Professional e2e test', () => {
  const professionalPageUrl = '/professional';
  const professionalPageUrlPattern = new RegExp('/professional(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const professionalSample = {};

  let professional;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/patientms/api/professionals+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/patientms/api/professionals').as('postEntityRequest');
    cy.intercept('DELETE', '/services/patientms/api/professionals/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (professional) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/patientms/api/professionals/${professional.id}`,
      }).then(() => {
        professional = undefined;
      });
    }
  });

  it('Professionals menu should load Professionals page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('professional');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Professional').should('exist');
    cy.url().should('match', professionalPageUrlPattern);
  });

  describe('Professional page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(professionalPageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Professional page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/professional/new$'));
        cy.getEntityCreateUpdateHeading('Professional');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', professionalPageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/patientms/api/professionals',
          body: professionalSample,
        }).then(({ body }) => {
          professional = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/patientms/api/professionals+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              body: [professional],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(professionalPageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details Professional page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('professional');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', professionalPageUrlPattern);
      });

      it('edit button click should load edit Professional page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Professional');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', professionalPageUrlPattern);
      });

      it('edit button click should load edit Professional page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Professional');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', professionalPageUrlPattern);
      });

      it('last delete button click should delete instance of Professional', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('professional').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', professionalPageUrlPattern);

        professional = undefined;
      });
    });
  });

  describe('new Professional page', () => {
    beforeEach(() => {
      cy.visit(`${professionalPageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Professional');
    });

    it('should create an instance of Professional', () => {
      cy.get(`[data-cy="firstName"]`).type('Chaya');
      cy.get(`[data-cy="firstName"]`).should('have.value', 'Chaya');

      cy.get(`[data-cy="lastName"]`).type('Schuppe');
      cy.get(`[data-cy="lastName"]`).should('have.value', 'Schuppe');

      cy.get(`[data-cy="role"]`).type('pinstripe gadzooks which');
      cy.get(`[data-cy="role"]`).should('have.value', 'pinstripe gadzooks which');

      cy.get(`[data-cy="specialty"]`).type('and');
      cy.get(`[data-cy="specialty"]`).should('have.value', 'and');

      cy.get(`[data-cy="email"]`).type('Bridget_Boehm@gmail.com');
      cy.get(`[data-cy="email"]`).should('have.value', 'Bridget_Boehm@gmail.com');

      cy.get(`[data-cy="phoneNumber"]`).type('amid');
      cy.get(`[data-cy="phoneNumber"]`).should('have.value', 'amid');

      cy.get(`[data-cy="imageUrl"]`).type('underperform');
      cy.get(`[data-cy="imageUrl"]`).should('have.value', 'underperform');

      cy.get(`[data-cy="initials"]`).type('photoshop signet');
      cy.get(`[data-cy="initials"]`).should('have.value', 'photoshop signet');

      cy.get(`[data-cy="location"]`).type('an');
      cy.get(`[data-cy="location"]`).should('have.value', 'an');

      cy.get(`[data-cy="teamId"]`).type('messenger');
      cy.get(`[data-cy="teamId"]`).should('have.value', 'messenger');

      cy.get(`[data-cy="createdDate"]`).type('2026-08-02');
      cy.get(`[data-cy="createdDate"]`).blur();
      cy.get(`[data-cy="createdDate"]`).should('have.value', '2026-08-02');

      cy.get(`[data-cy="modifiedDate"]`).type('2026-08-03');
      cy.get(`[data-cy="modifiedDate"]`).blur();
      cy.get(`[data-cy="modifiedDate"]`).should('have.value', '2026-08-03');

      cy.get(`[data-cy="createdBy"]`).type('whereas rabbit fond');
      cy.get(`[data-cy="createdBy"]`).should('have.value', 'whereas rabbit fond');

      cy.get(`[data-cy="modifiedBy"]`).type('restfully');
      cy.get(`[data-cy="modifiedBy"]`).should('have.value', 'restfully');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(201);
        professional = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(200);
      });
      cy.url().should('match', professionalPageUrlPattern);
    });
  });
});
