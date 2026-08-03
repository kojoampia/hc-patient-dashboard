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

describe('Task e2e test', () => {
  const taskPageUrl = '/task';
  const taskPageUrlPattern = new RegExp('/task(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const taskSample = {};

  let task;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/patientms/api/tasks+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/patientms/api/tasks').as('postEntityRequest');
    cy.intercept('DELETE', '/services/patientms/api/tasks/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (task) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/patientms/api/tasks/${task.id}`,
      }).then(() => {
        task = undefined;
      });
    }
  });

  it('Tasks menu should load Tasks page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('task');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Task').should('exist');
    cy.url().should('match', taskPageUrlPattern);
  });

  describe('Task page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(taskPageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Task page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/task/new$'));
        cy.getEntityCreateUpdateHeading('Task');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', taskPageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/patientms/api/tasks',
          body: taskSample,
        }).then(({ body }) => {
          task = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/patientms/api/tasks+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              headers: {
                link: '<http://localhost/services/patientms/api/tasks?page=0&size=20>; rel="last",<http://localhost/services/patientms/api/tasks?page=0&size=20>; rel="first"',
              },
              body: [task],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(taskPageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details Task page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('task');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', taskPageUrlPattern);
      });

      it('edit button click should load edit Task page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Task');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', taskPageUrlPattern);
      });

      it('edit button click should load edit Task page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Task');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', taskPageUrlPattern);
      });

      it('last delete button click should delete instance of Task', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('task').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', taskPageUrlPattern);

        task = undefined;
      });
    });
  });

  describe('new Task page', () => {
    beforeEach(() => {
      cy.visit(`${taskPageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Task');
    });

    it('should create an instance of Task', () => {
      cy.get(`[data-cy="name"]`).type('needy berate');
      cy.get(`[data-cy="name"]`).should('have.value', 'needy berate');

      cy.get(`[data-cy="description"]`).type('although phooey');
      cy.get(`[data-cy="description"]`).should('have.value', 'although phooey');

      cy.get(`[data-cy="schedule"]`).type('2024-02-06');
      cy.get(`[data-cy="schedule"]`).blur();
      cy.get(`[data-cy="schedule"]`).should('have.value', '2024-02-06');

      cy.get(`[data-cy="scheduledAt"]`).type('2024-02-06T00:30');
      cy.get(`[data-cy="scheduledAt"]`).blur();
      cy.get(`[data-cy="scheduledAt"]`).should('have.value', '2024-02-06T00:30');

      cy.get(`[data-cy="duration"]`).type('10536.78');
      cy.get(`[data-cy="duration"]`).should('have.value', '10536.78');

      cy.get(`[data-cy="status"]`).select('PENDING');

      cy.get(`[data-cy="location"]`).type('till');
      cy.get(`[data-cy="location"]`).should('have.value', 'till');

      cy.get(`[data-cy="caseId"]`).type('silver');
      cy.get(`[data-cy="caseId"]`).should('have.value', 'silver');

      cy.get(`[data-cy="attendantId"]`).type('ha bleak upliftingly');
      cy.get(`[data-cy="attendantId"]`).should('have.value', 'ha bleak upliftingly');

      cy.get(`[data-cy="teamId"]`).type('midst');
      cy.get(`[data-cy="teamId"]`).should('have.value', 'midst');

      cy.get(`[data-cy="patientId"]`).type('because tremendously geez');
      cy.get(`[data-cy="patientId"]`).should('have.value', 'because tremendously geez');

      cy.get(`[data-cy="attendant"]`).type('litigation intuition');
      cy.get(`[data-cy="attendant"]`).should('have.value', 'litigation intuition');

      cy.get(`[data-cy="createdDate"]`).type('2024-02-06');
      cy.get(`[data-cy="createdDate"]`).blur();
      cy.get(`[data-cy="createdDate"]`).should('have.value', '2024-02-06');

      cy.get(`[data-cy="modifiedDate"]`).type('2024-02-06');
      cy.get(`[data-cy="modifiedDate"]`).blur();
      cy.get(`[data-cy="modifiedDate"]`).should('have.value', '2024-02-06');

      cy.get(`[data-cy="createdBy"]`).type('reproachfully postpone');
      cy.get(`[data-cy="createdBy"]`).should('have.value', 'reproachfully postpone');

      cy.get(`[data-cy="modifiedBy"]`).type('reliable lucky');
      cy.get(`[data-cy="modifiedBy"]`).should('have.value', 'reliable lucky');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(201);
        task = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(200);
      });
      cy.url().should('match', taskPageUrlPattern);
    });
  });
});
