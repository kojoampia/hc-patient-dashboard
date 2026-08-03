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

describe('Allergy e2e test', () => {
  const allergyPageUrl = '/allergy';
  const allergyPageUrlPattern = new RegExp('/allergy(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const allergySample = {};

  let allergy;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/patientms/api/allergies+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/patientms/api/allergies').as('postEntityRequest');
    cy.intercept('DELETE', '/services/patientms/api/allergies/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (allergy) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/patientms/api/allergies/${allergy.id}`,
      }).then(() => {
        allergy = undefined;
      });
    }
  });

  it('Allergies menu should load Allergies page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('allergy');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Allergy').should('exist');
    cy.url().should('match', allergyPageUrlPattern);
  });

  describe('Allergy page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(allergyPageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Allergy page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/allergy/new$'));
        cy.getEntityCreateUpdateHeading('Allergy');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', allergyPageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/patientms/api/allergies',
          body: allergySample,
        }).then(({ body }) => {
          allergy = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/patientms/api/allergies+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              body: [allergy],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(allergyPageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details Allergy page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('allergy');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', allergyPageUrlPattern);
      });

      it('edit button click should load edit Allergy page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Allergy');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', allergyPageUrlPattern);
      });

      it('edit button click should load edit Allergy page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Allergy');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', allergyPageUrlPattern);
      });

      it('last delete button click should delete instance of Allergy', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('allergy').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', allergyPageUrlPattern);

        allergy = undefined;
      });
    });
  });

  describe('new Allergy page', () => {
    beforeEach(() => {
      cy.visit(`${allergyPageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Allergy');
    });

    it('should create an instance of Allergy', () => {
      cy.get(`[data-cy="patientId"]`).type('boo indeed beside');
      cy.get(`[data-cy="patientId"]`).should('have.value', 'boo indeed beside');

      cy.get(`[data-cy="name"]`).type('flame');
      cy.get(`[data-cy="name"]`).should('have.value', 'flame');

      cy.get(`[data-cy="category"]`).select('FOOD');

      cy.get(`[data-cy="severity"]`).select('SEVERE');

      cy.get(`[data-cy="reaction"]`).type('old-fashioned acidify although');
      cy.get(`[data-cy="reaction"]`).should('have.value', 'old-fashioned acidify although');

      cy.get(`[data-cy="notedOn"]`).type('2026-08-03');
      cy.get(`[data-cy="notedOn"]`).blur();
      cy.get(`[data-cy="notedOn"]`).should('have.value', '2026-08-03');

      cy.get(`[data-cy="notedById"]`).type('gosh enzyme unless');
      cy.get(`[data-cy="notedById"]`).should('have.value', 'gosh enzyme unless');

      cy.get(`[data-cy="createdDate"]`).type('2026-08-03');
      cy.get(`[data-cy="createdDate"]`).blur();
      cy.get(`[data-cy="createdDate"]`).should('have.value', '2026-08-03');

      cy.get(`[data-cy="modifiedDate"]`).type('2026-08-03');
      cy.get(`[data-cy="modifiedDate"]`).blur();
      cy.get(`[data-cy="modifiedDate"]`).should('have.value', '2026-08-03');

      cy.get(`[data-cy="createdBy"]`).type('fatten upon');
      cy.get(`[data-cy="createdBy"]`).should('have.value', 'fatten upon');

      cy.get(`[data-cy="modifiedBy"]`).type('trim');
      cy.get(`[data-cy="modifiedBy"]`).should('have.value', 'trim');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(201);
        allergy = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(200);
      });
      cy.url().should('match', allergyPageUrlPattern);
    });
  });
});
