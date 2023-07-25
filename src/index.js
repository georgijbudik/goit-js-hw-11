import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { fetchImages } from './pixabay-api';
import { throttle } from 'lodash';

const refs = {
  formEl: document.querySelector('.search-form'),
  galleryEl: document.querySelector('.gallery'),
  loadMoreBtn: document.querySelector('.load-more'),
};

let searchQuery = '';
let prevSearchQuery = '';
let currentPage = 1;
const MAX_CARDS_PER_PAGE = 40;

async function handleSubmit(e) {
  e.preventDefault();
  searchQuery = e.target.elements.searchQuery.value.trim();
  if (searchQuery === '') {
    Notiflix.Notify.warning('Please enter a search term.');
    return;
  }
  if (searchQuery === prevSearchQuery) {
    return;
  }
  prevSearchQuery = searchQuery;
  clearGallery();
  hideLoadMoreBtn();
  currentPage = 1;
  try {
    const { hits, totalHits } = await fetchImages(searchQuery, currentPage);
    if (hits.length === 0) {
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }

    renderImageCards(hits);
    lightbox.refresh();
    Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);
    if (totalHits <= MAX_CARDS_PER_PAGE) {
      hideLoadMoreBtn();
      Notiflix.Notify.failure(
        "We're sorry, but you've reached the end of search results."
      );
      return;
    }
    showLoadMoreBtn();
    currentPage += 1;
    checkIfEndOfResults(hits.length, totalHits);
  } catch (error) {
    hideLoadMoreBtn();
    Notiflix.Notify.failure('Failed to fetch images. Please try again.');
  }
}

const renderImageCards = images => {
  const markup = images.map(createCards).join('');
  refs.galleryEl.insertAdjacentHTML('beforeend', markup);
  hideLoadMoreBtn();
};

const createCards = ({
  webformatURL,
  tags,
  likes,
  views,
  comments,
  downloads,
  largeImageURL,
}) =>
  `
  <a href="${largeImageURL}">
  <div class="photo-card">
  <img src="${webformatURL}" alt="${tags}" loading="lazy" />
  <div class="info">
    <p class="info-item">
      <b>Likes</b> ${likes}
    </p>
    <p class="info-item">
      <b>Views</b> ${views}
    </p>
    <p class="info-item">
      <b>Comments</b> ${comments}
    </p>
    <p class="info-item"> 
      <b>Downloads</b> ${downloads}
    </p>
  </div>
</div></a>`;

async function onLoadMore() {
  try {
    const { hits, totalHits } = await fetchImages(searchQuery, currentPage);
    if (hits.length === 0) {
      hideLoadMoreBtn();
      return;
    }
    renderImageCards(hits);
    lightbox.refresh();
    const totalPages = Math.ceil(totalHits / MAX_CARDS_PER_PAGE);
    if (currentPage < totalPages) {
      showLoadMoreBtn();
    } else {
      hideLoadMoreBtn();
      Notiflix.Notify.failure(
        "We're sorry, but you've reached the end of search results."
      );
      return;
    }
    scrollToNextPage();
    currentPage += 1;
    checkIfEndOfResults(hits.length, totalHits);
  } catch (error) {
    hideLoadMoreBtn();
    Notiflix.Notify.failure('Failed to fetch images. Please try again.');
  }
}

const clearGallery = () => {
  refs.galleryEl.innerHTML = '';
};

const hideLoadMoreBtn = () => {
  refs.loadMoreBtn.style.display = 'none';
};

const showLoadMoreBtn = () => {
  refs.loadMoreBtn.style.display = 'block';
};

const checkIfEndOfResults = (imagesCount, totalHits) => {
  if (imagesCount >= totalHits) {
    Notiflix.Notify.failure(
      "We're sorry, but you've reached the end of search results."
    );
  }
};

const lightbox = new SimpleLightbox('.gallery a', {});
const throttledOnLoadMore = throttle(onLoadMore, 500);

refs.formEl.addEventListener('submit', handleSubmit);
refs.loadMoreBtn.addEventListener('click', throttledOnLoadMore);

const scrollToNextPage = () => {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
};
