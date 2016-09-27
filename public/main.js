import { homeController } from './scripts/controllers/home-controller.js';
import { usersController } from './scripts/controllers/users-controller.js';
import { booksController } from './scripts/controllers/books-controller.js';


(function () {
    let sammyApp = Sammy('#content', function () {

        this.get('#/', function () {
            this.redirect('#/home');
        });

        this.get('#/home', (context) => {
            homeController.all(context, '#content');
        });

        this.get('#/login', (context) => {
            usersController.login(context, '#content');
        });

        this.get('#/register', (context) => {
            usersController.register(context, '#content');
        });

        this.get('#/logout', usersController.logout);

        this.get('#/books', (context) => {
            booksController.all(context, '#content');
        });

        this.get('#/profile', (context) => {
            usersController.profile(context, '#content');
        });

        this.get('#/add-book', (context) => {
            booksController.addBook(context, '#content');
        });

        this.get('#/books/:id', (context) => {
            booksController.singleBook(context, '#content');
        });
    });

    $(function () {
        sammyApp.run('#/');
    });

    usersController.isUserLoggedIn()
        .then((isLogged) => {
            if (isLogged) {
                $('body').addClass('logged');
                $('#login').addClass('hidden');
                $('#register').addClass('hidden');
                $('#logout').removeClass('hidden');
            }
            else {
                $('body').removeClass('logged');
                $('#login').removeClass('hidden');
                $('#register').removeClass('hidden');
                $('#logout').addClass('hidden');
            }
        });
})();