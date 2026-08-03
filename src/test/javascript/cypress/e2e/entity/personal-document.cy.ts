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

describe('PersonalDocument e2e test', () => {
  const personalDocumentPageUrl = '/personal-document';
  const personalDocumentPageUrlPattern = new RegExp('/personal-document(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const personalDocumentSample = {};

  let personalDocument;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/patientms/api/personal-documents+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/patientms/api/personal-documents').as('postEntityRequest');
    cy.intercept('DELETE', '/services/patientms/api/personal-documents/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (personalDocument) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/patientms/api/personal-documents/${personalDocument.id}`,
      }).then(() => {
        personalDocument = undefined;
      });
    }
  });

  it('PersonalDocuments menu should load PersonalDocuments page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('personal-document');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('PersonalDocument').should('exist');
    cy.url().should('match', personalDocumentPageUrlPattern);
  });

  describe('PersonalDocument page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(personalDocumentPageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create PersonalDocument page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/personal-document/new$'));
        cy.getEntityCreateUpdateHeading('PersonalDocument');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', personalDocumentPageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/patientms/api/personal-documents',
          body: personalDocumentSample,
        }).then(({ body }) => {
          personalDocument = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/patientms/api/personal-documents+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              body: [personalDocument],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(personalDocumentPageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details PersonalDocument page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('personalDocument');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', personalDocumentPageUrlPattern);
      });

      it('edit button click should load edit PersonalDocument page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('PersonalDocument');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', personalDocumentPageUrlPattern);
      });

      it('edit button click should load edit PersonalDocument page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('PersonalDocument');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', personalDocumentPageUrlPattern);
      });

      it('last delete button click should delete instance of PersonalDocument', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('personalDocument').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', personalDocumentPageUrlPattern);

        personalDocument = undefined;
      });
    });
  });

  describe('new PersonalDocument page', () => {
    beforeEach(() => {
      cy.visit(`${personalDocumentPageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('PersonalDocument');
    });

    it('should create an instance of PersonalDocument', () => {
      cy.get(`[data-cy="name"]`).type('loftily opposite');
      cy.get(`[data-cy="name"]`).should('have.value', 'loftily opposite');

      cy.get(`[data-cy="category"]`).type('amid lest waddle');
      cy.get(`[data-cy="category"]`).should('have.value', 'amid lest waddle');

      cy.get(`[data-cy="url"]`).type('https://youthful-back.net/');
      cy.get(`[data-cy="url"]`).should('have.value', 'https://youthful-back.net/');

      cy.get(`[data-cy="patientId"]`).type('yet call over');
      cy.get(`[data-cy="patientId"]`).should('have.value', 'yet call over');

      cy.get(`[data-cy="issuedOn"]`).type('2024-03-30');
      cy.get(`[data-cy="issuedOn"]`).blur();
      cy.get(`[data-cy="issuedOn"]`).should('have.value', '2024-03-30');

      cy.get(`[data-cy="expiresOn"]`).type('2024-03-30');
      cy.get(`[data-cy="expiresOn"]`).blur();
      cy.get(`[data-cy="expiresOn"]`).should('have.value', '2024-03-30');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(201);
        personalDocument = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(200);
      });
      cy.url().should('match', personalDocumentPageUrlPattern);
    });
  });
});
