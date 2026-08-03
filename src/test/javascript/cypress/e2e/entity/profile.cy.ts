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

describe('Profile e2e test', () => {
  const profilePageUrl = '/profile';
  const profilePageUrlPattern = new RegExp('/profile(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const profileSample = {};

  let profile;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/patientms/api/profiles+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/patientms/api/profiles').as('postEntityRequest');
    cy.intercept('DELETE', '/services/patientms/api/profiles/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (profile) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/patientms/api/profiles/${profile.id}`,
      }).then(() => {
        profile = undefined;
      });
    }
  });

  it('Profiles menu should load Profiles page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('profile');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Profile').should('exist');
    cy.url().should('match', profilePageUrlPattern);
  });

  describe('Profile page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(profilePageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Profile page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/profile/new$'));
        cy.getEntityCreateUpdateHeading('Profile');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', profilePageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/patientms/api/profiles',
          body: profileSample,
        }).then(({ body }) => {
          profile = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/patientms/api/profiles+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              headers: {
                link: '<http://localhost/services/patientms/api/profiles?page=0&size=20>; rel="last",<http://localhost/services/patientms/api/profiles?page=0&size=20>; rel="first"',
              },
              body: [profile],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(profilePageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details Profile page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('profile');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', profilePageUrlPattern);
      });

      it('edit button click should load edit Profile page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Profile');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', profilePageUrlPattern);
      });

      it('edit button click should load edit Profile page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Profile');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', profilePageUrlPattern);
      });

      it('last delete button click should delete instance of Profile', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('profile').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', profilePageUrlPattern);

        profile = undefined;
      });
    });
  });

  describe('new Profile page', () => {
    beforeEach(() => {
      cy.visit(`${profilePageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Profile');
    });

    it('should create an instance of Profile', () => {
      cy.get(`[data-cy="patientId"]`).type('pronoun');
      cy.get(`[data-cy="patientId"]`).should('have.value', 'pronoun');

      cy.get(`[data-cy="firstName"]`).type('Osborne');
      cy.get(`[data-cy="firstName"]`).should('have.value', 'Osborne');

      cy.get(`[data-cy="middleNames"]`).type('utilized unlike');
      cy.get(`[data-cy="middleNames"]`).should('have.value', 'utilized unlike');

      cy.get(`[data-cy="lastName"]`).type('Rowe');
      cy.get(`[data-cy="lastName"]`).should('have.value', 'Rowe');

      cy.get(`[data-cy="membership"]`).type('among unwilling anenst');
      cy.get(`[data-cy="membership"]`).should('have.value', 'among unwilling anenst');

      cy.get(`[data-cy="birthDate"]`).type('2024-02-06');
      cy.get(`[data-cy="birthDate"]`).blur();
      cy.get(`[data-cy="birthDate"]`).should('have.value', '2024-02-06');

      cy.get(`[data-cy="sex"]`).type('woot kissingly absentmindedly');
      cy.get(`[data-cy="sex"]`).should('have.value', 'woot kissingly absentmindedly');

      cy.get(`[data-cy="bloodGroup"]`).type('meh next semicolon');
      cy.get(`[data-cy="bloodGroup"]`).should('have.value', 'meh next semicolon');

      cy.get(`[data-cy="mobilePhone"]`).type('barring');
      cy.get(`[data-cy="mobilePhone"]`).should('have.value', 'barring');

      cy.get(`[data-cy="phoneNumber"]`).type('righteously');
      cy.get(`[data-cy="phoneNumber"]`).should('have.value', 'righteously');

      cy.get(`[data-cy="email"]`).type('Toy.Wehner@hotmail.com');
      cy.get(`[data-cy="email"]`).should('have.value', 'Toy.Wehner@hotmail.com');

      cy.get(`[data-cy="cardType"]`).type('excepting sleep caterwaul');
      cy.get(`[data-cy="cardType"]`).should('have.value', 'excepting sleep caterwaul');

      cy.get(`[data-cy="cardNumber"]`).type('but delightfully rally');
      cy.get(`[data-cy="cardNumber"]`).should('have.value', 'but delightfully rally');

      cy.get(`[data-cy="contacts"]`).type('painfully vaguely');
      cy.get(`[data-cy="contacts"]`).should('have.value', 'painfully vaguely');

      cy.get(`[data-cy="address"]`).type('furthermore through bountiful');
      cy.get(`[data-cy="address"]`).should('have.value', 'furthermore through bountiful');

      cy.get(`[data-cy="team"]`).type('inverse huzzah');
      cy.get(`[data-cy="team"]`).should('have.value', 'inverse huzzah');

      cy.get(`[data-cy="imageUrl"]`).type('incidentally shakily tomorrow');
      cy.get(`[data-cy="imageUrl"]`).should('have.value', 'incidentally shakily tomorrow');

      cy.get(`[data-cy="about"]`).type('ick yawning gah');
      cy.get(`[data-cy="about"]`).should('have.value', 'ick yawning gah');

      cy.get(`[data-cy="socialHandle"]`).type('toward');
      cy.get(`[data-cy="socialHandle"]`).should('have.value', 'toward');

      cy.get(`[data-cy="careAngelName"]`).type('female convert');
      cy.get(`[data-cy="careAngelName"]`).should('have.value', 'female convert');

      cy.get(`[data-cy="careAngelPhone"]`).type('apud dreamily');
      cy.get(`[data-cy="careAngelPhone"]`).should('have.value', 'apud dreamily');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(201);
        profile = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(200);
      });
      cy.url().should('match', profilePageUrlPattern);
    });
  });
});
