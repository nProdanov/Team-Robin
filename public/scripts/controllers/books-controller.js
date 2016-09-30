import { userModel } from '../models/user-model.js';
import { booksModel } from '../models/books-model.js';
import { pageView } from '../view/page-view.js';
import { notificator } from '../helpers/notificator.js';

const DEFAULT_BOOK_COVER_URL = 'http://www.jameshmayfield.com/wp-content/uploads/2015/03/defbookcover-min.jpg';

function getStatusOfBook(currentUserInfo, book) {
    let booksToRead = currentUserInfo.booksToRead || [];
    let booksRead = currentUserInfo.booksRead || [];
    let booksReading = currentUserInfo.booksCurrentlyReading || [];

    let isToRead = booksToRead.some((wr) => { return wr._id === book._id; });
    let isRead = booksRead.some((r) => { return r._id === book._id; });
    let isReading = booksReading.some((cr) => { return cr._id === book._id; });

    switch (true) {
        case isToRead: return 'Want to read';
        case isRead: return 'Already read';
        case isReading: return 'Currently reading';
        default: return 'No status';
    }
}

function addNickNamesToReviews(book) {
    let reviews = book.reviews;

    reviews = reviews.map((review) => {
        let nickName;
        userModel.getNickNameById(review.userId)
            .then((resNickName) => {
                nickName = resNickName;
                review.nickName = nickName;
            });
    });

    return book;
}

function convertRatingToArray(book) {
    let rating = book.rating;
    if (rating === 0) {
        book.rating = undefined;
    }
    else {
        book.rating = [];
        for (let i = 0; i < rating; i += 1) {
            book.rating.push(i);
        }
    }

    return book;
}

class BooksController {
    getBooks(context, selector) {
        let page = 0;

        booksModel.getFirstBooks(page)
            .then((res) => {
                let coveredBooks = res.map((book) => {
                    let coverAsNumber = parseInt(book.coverUrl);
                    if (!book.coverUrl || !isNaN(coverAsNumber)) {
                        book.coverUrl = DEFAULT_BOOK_COVER_URL;
                    }
                    return book;
                });
                pageView.booksPage(selector);
                pageView.loadBooks(selector, res);
            }, (err) => {
                console.log(err);
            })
            .then(() => {
                $(window).scroll(function () {
                    if (window.location.href === 'http://localhost:3000/#/books') {
                        let curBottom = $(window).scrollTop() + $(window).height();
                        let containerBottom = $(selector).offset().top + $(selector).height();
                        if (curBottom >= containerBottom) {
                            page += 1;
                            booksModel.getMoreBooks(page)
                                .then((res) => {
                                    pageView.loadBooks(selector, res);
                                });
                        }
                    }
                    else {
                        page = 0;
                    }
                });
            });
    }

    addBook(context, selector) {
        pageView.addBookPage(selector)
            .then(() => {
                $('#btn-add-book').on('click', function () {
                    let title = $('#tb-title').val();
                    let author = $('#tb-author').val();
                    let description = $('#tb-description').val();
                    let pages = $('#tb-pages').val();
                    let coverUrl = $('#tb-cover').val() || DEFAULT_BOOK_COVER_URL;
                    let genres = $('#tb-genres').val()
                        .split(', ');
                    let bookToAdd = {
                        title,
                        author,
                        description,
                        pages,
                        coverUrl,
                        genres
                    };

                    booksModel.addBook(bookToAdd)
                        .then((res) => {
                            notificator.success('Book added successfully');
                            $('#tb-title').val('');
                            $('#tb-author').val('');
                            $('#tb-description').val('');
                            $('#tb-pages').val('');
                            $('#tb-cover').val('');
                            $('#tb-genres').val('');
                        }, (err) => {
                            console.log(err);
                            notificator.error(err.responseText);
                        });
                });
            });
    }

    singleBook(context, selector) {
        let book, isLoggedIn;
        booksModel.getSingleBookInfo(context.params.id)
            .then((resBook) => {
                addNickNamesToReviews(resBook);
                convertRatingToArray(resBook);
                book = resBook;

                isLoggedIn = $('body').hasClass('logged');
                if (isLoggedIn) {
                    return userModel.getCurrentUserInfo();
                }
            })
            .then((currentUserInfo) => {
                if (isLoggedIn) {
                    book.status = getStatusOfBook(currentUserInfo, book);
                }

                return pageView.singleBookPage(selector, book);
            })
            .then(() => {
                $('.rating-adder').on('click', '.btn-add-rating', function(){
                    let rating = $(this).attr('data-id');
                    let bookId = $('#book-title').attr('data-id');
                    booksModel.sendRating(bookId, rating);
                    location.reload();
                });
            });
    }

    resultGenreBooks(context, selector) {
        booksModel.getAll()
            .then((books) => {
                let genrePattern = context.params.genre.toLowerCase();
                let filteredBooks = books.filter((book) => {
                    let genres = book.genres || [];
                    if (genres.some((gen) => { return gen.toLowerCase() === genrePattern; })) {
                        return true;
                    }
                    else {
                        return false;
                    }
                });

                return {
                    filteredBooks,
                    pattern: context.params.genre
                };
            }, (err) => {
                console.log(err);
            })
            .then((res) => {
                return pageView.searchResultPage(selector, res);
            })
            .then();
    }

    storeAllBooksCount() {
        booksModel.getAllBooksCount()
            .then();
    }
}

let booksController = new BooksController();
export { booksController };