describe('blog tests', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/')
    cy.assertHome('/')
  })

  afterEach(() => {
    cy.cleanupUser()
  })

  it('renders a blog', () => {
    cy.visit('/blog/react-ts')
    cy.findByText(/React & Ts/i)
  })

  it('renders a base64 blur image', () => {
    cy.login()
    cy.visit('/')
    cy.assertHome('/')
    cy.visit('/blog/react-ts')
    //cy.findByAltText(/React & Ts/i).should('be.a')
    cy.findByTestId('blur-image')
      .then(s => {
        console.log(s)
        debugger
      })
      .should('have.attr', 'alt')
      .and('include', 'React')
  })

  it('renders a cloud image', () => {
    cy.login()
    cy.visit('/')
    cy.assertHome('/')
    cy.visit('/blog/react-ts')
    cy.findByTestId('banner-image')
      .should('have.attr', 'alt')
      .and('include', 'React')
  })
})

// it(`should show an error message if there's an error registering`, () => {
//     cy.server()
//     cy.route({
//       method: 'POST',
//       url: 'http://localhost:3000/register',
//       status: 500,
//       response: {},
//     })
//     cy.visit('/register')
//     cy.findByText(/submit/i).click()
//     cy.findByText(/error.*try again/i)
//   })
