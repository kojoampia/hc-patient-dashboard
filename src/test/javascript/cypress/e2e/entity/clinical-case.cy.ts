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

describe('ClinicalCase e2e test', () => {
  const clinicalCasePageUrl = '/clinical-case';
  const clinicalCasePageUrlPattern = new RegExp('/clinical-case(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const clinicalCaseSample = {};

  let clinicalCase;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/patientms/api/clinical-cases+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/patientms/api/clinical-cases').as('postEntityRequest');
    cy.intercept('DELETE', '/services/patientms/api/clinical-cases/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (clinicalCase) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/patientms/api/clinical-cases/${clinicalCase.id}`,
      }).then(() => {
        clinicalCase = undefined;
      });
    }
  });

  it('ClinicalCases menu should load ClinicalCases page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('clinical-case');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('ClinicalCase').should('exist');
    cy.url().should('match', clinicalCasePageUrlPattern);
  });

  describe('ClinicalCase page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(clinicalCasePageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create ClinicalCase page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/clinical-case/new$'));
        cy.getEntityCreateUpdateHeading('ClinicalCase');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', clinicalCasePageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/patientms/api/clinical-cases',
          body: clinicalCaseSample,
        }).then(({ body }) => {
          clinicalCase = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/patientms/api/clinical-cases+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              headers: {
                link: '<http://localhost/services/patientms/api/clinical-cases?page=0&size=20>; rel="last",<http://localhost/services/patientms/api/clinical-cases?page=0&size=20>; rel="first"',
              },
              body: [clinicalCase],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(clinicalCasePageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details ClinicalCase page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('clinicalCase');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', clinicalCasePageUrlPattern);
      });

      it('edit button click should load edit ClinicalCase page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('ClinicalCase');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', clinicalCasePageUrlPattern);
      });

      it('edit button click should load edit ClinicalCase page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('ClinicalCase');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', clinicalCasePageUrlPattern);
      });

      it('last delete button click should delete instance of ClinicalCase', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('clinicalCase').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', clinicalCasePageUrlPattern);

        clinicalCase = undefined;
      });
    });
  });

  describe('new ClinicalCase page', () => {
    beforeEach(() => {
      cy.visit(`${clinicalCasePageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('ClinicalCase');
    });

    it('should create an instance of ClinicalCase', () => {
      cy.get(`[data-cy="patientId"]`).type('when until');
      cy.get(`[data-cy="patientId"]`).should('have.value', 'when until');

      cy.get(`[data-cy="caseNumber"]`).type('12996');
      cy.get(`[data-cy="caseNumber"]`).should('have.value', '12996');

      cy.get(`[data-cy="title"]`).type('swift that vinyl');
      cy.get(`[data-cy="title"]`).should('have.value', 'swift that vinyl');

      cy.get(`[data-cy="openedAt"]`).type('2026-07-29T17:11');
      cy.get(`[data-cy="openedAt"]`).blur();
      cy.get(`[data-cy="openedAt"]`).should('have.value', '2026-07-29T17:11');

      cy.get(`[data-cy="closedAt"]`).type('2026-07-29T15:12');
      cy.get(`[data-cy="closedAt"]`).blur();
      cy.get(`[data-cy="closedAt"]`).should('have.value', '2026-07-29T15:12');

      cy.get(`[data-cy="brief"]`).type('regarding footwear');
      cy.get(`[data-cy="brief"]`).should('have.value', 'regarding footwear');

      cy.get(`[data-cy="status"]`).select('CLOSED');

      cy.get(`[data-cy="symptoms"]`).type('huzzah');
      cy.get(`[data-cy="symptoms"]`).should('have.value', 'huzzah');

      cy.get(`[data-cy="diagnosis"]`).type('unfolded');
      cy.get(`[data-cy="diagnosis"]`).should('have.value', 'unfolded');

      cy.get(`[data-cy="assignedProfessionalId"]`).type('provided clash bet');
      cy.get(`[data-cy="assignedProfessionalId"]`).should('have.value', 'provided clash bet');

      cy.get(`[data-cy="assignedRosterId"]`).type('yowza');
      cy.get(`[data-cy="assignedRosterId"]`).should('have.value', 'yowza');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(201);
        clinicalCase = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(200);
      });
      cy.url().should('match', clinicalCasePageUrlPattern);
    });
  });
});
