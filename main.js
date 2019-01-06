const noop = () => {};
const getStartPoint = element => element.getBoundingClientRect().left; 

const selector = {
  'VIEWPORT'     : '.slider__viewport',
  'TRACK'        : '.slider__track',
  'SLIDE'        : '.slider__slide',
  'ACTIVE_SLIDE' : '.slider__slide.slider__slide--active',
  'FICTIVE_SLIDE': '.slider__slide.slider__slide--fictive',
  'DOT_LIST'     : '.slider__dots',
  'DOT'          : '.slider__dots-item',
  'PREV'         : '.slider__btn.slider__btn--prev',
  'NEXT'         : '.slider__btn.slider__btn--next',
};

const className = {
  'FICTIVE_SLIDE': 'slider__slide--fictive',
  'ACTIVE_SLIDE' : 'slider__slide--active',
  'DOT'          : 'slider__dots-item',
  'ACTIVE_DOT'   : 'slider__dots-item--active',
};

class Slider {
  static init(element) {
    return new Slider(element);
  };

  constructor(element) {
    this.element = element;

    this.viewport = this.element.querySelector(selector.VIEWPORT);
    this.track    = this.element.querySelector(selector.TRACK);
    this.slides   = this.element.querySelectorAll(selector.SLIDE);
    this.dotList  = this.element.querySelector(selector.DOT_LIST);

    this.prev = this.element.querySelector(selector.PREV);
    this.next = this.element.querySelector(selector.NEXT);

    this.viewportStartPoint = getStartPoint(this.viewport);

    this.len = this.slides.length;

    this.state = {
      activeSlideIndex: 0,
      isClickable: true,
      trackPosition: 0,
    };

    this.addFictiveSlides();

    // Slides with fictive slides for set width of slides when window resize
    this.allSlides = this.element.querySelectorAll(selector.SLIDE);

    this.fictiveSlides     = this.element.querySelectorAll(selector.FICTIVE_SLIDE);
    this.leftFictiveSlide  = this.fictiveSlides[0];
    this.rightFictiveSlide = this.fictiveSlides[1];

    this.initDots();
    this.setSlideWidth();

    const animationDuration = 0;
    this.setActiveSlide(0, animationDuration);

    this.addEventListeners();
  }

  addEventListeners() {
    let timerId = null;
    window.addEventListener('resize', () => {
      clearTimeout(timerId);
      this.setSlideWidth();

      timerId = setTimeout(() => {
        const { activeSlideIndex } = this.state;
        this.viewportStartPoint = getStartPoint(this.viewport);

        const newTrackPosition = this.getNewTrackPosition(this.slides[activeSlideIndex]);
        const animationDuration = 0;
        this.setTrackPosition(newTrackPosition, animationDuration)
      }, 500);
    });

    this.dotList.addEventListener('click', this.handleDotClick.bind(this));
    this.prev.addEventListener('click', () => {
      this.changeSlide(-1);
    });
    this.next.addEventListener('click', () => {
      this.changeSlide(1);
    });
  }

  handleDotClick({ target }) {
    const dot = target.closest(selector.DOT);
    if (!dot || !this.state.isClickable) {
      return;
    }

    const { activeSlideIndex } = this.state;
    const newSlideIndex = Number(dot.dataset.slideIndex);

    if (activeSlideIndex === newSlideIndex) {
      return;
    }

    this.setState({ isClickable: false });
    this.setActiveSlide(newSlideIndex);
  }

  changeSlide(change) {
    const { activeSlideIndex, isClickable } = this.state;
    if (!isClickable) {
      return;
    }

    this.setState({ isClickable: false });

    const isLastSlide = activeSlideIndex === this.len - 1;
    const isFirstSlide = activeSlideIndex === 0;

    let newSlideIndex = activeSlideIndex + change;

    if (isFirstSlide || isLastSlide) {
      newSlideIndex = isFirstSlide ? this.len - 1 : 0;
      const newTrackPosition = this.getNewTrackPosition(
        isFirstSlide ? this.rightFictiveSlide : this.leftFictiveSlide
      );
      
      this.setTrackPosition(newTrackPosition, {
        callback: () => {
          const animationDuration = 0;
          this.setActiveSlide(newSlideIndex, animationDuration);
        }
      });

      return;
    }

    this.setActiveSlide(newSlideIndex);
  }

  setActiveSlide(newSlideIndex, duration = 500) {
    const { activeSlideIndex } = this.state;

    this.dots[activeSlideIndex].classList.remove(className.ACTIVE_DOT);
    this.slides[activeSlideIndex].classList.remove(className.ACTIVE_SLIDE);

    const slide = this.slides[newSlideIndex];
    slide.classList.add(className.ACTIVE_SLIDE);
    this.dots[newSlideIndex].classList.add(className.ACTIVE_DOT);

    this.setState({ activeSlideIndex: newSlideIndex });
    this.setTrackPosition(this.getNewTrackPosition(slide), { duration });
  }

  setTrackPosition(position, options = {}) {
    const { callback = noop, duration = 500 } = options;
    const start = performance.now();

    const { trackPosition: currentPosition } = this.state;
    const animate = (time) => {
      let progress = (time - start) / duration;
      if (progress > 1) progress = 1;

      this.track.style.transform = `translate3d(${progress * (position - currentPosition) + currentPosition}px, 0, 0)`;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.setState({ isClickable: true, trackPosition: position })
        callback();
      }
    }

    requestAnimationFrame(animate)
  }

  getNewTrackPosition(slide) {
    const slideStartPoint = getStartPoint(slide);
    const diff = this.viewportStartPoint - slideStartPoint;
    const newTrackPosition = this.state.trackPosition + diff;
    return newTrackPosition;
  }

  addFictiveSlides() {
    const firstSlideClone = this.slides[0].cloneNode(true);
    const lastSlideClone  = this.slides[this.len - 1].cloneNode(true);
    firstSlideClone.classList.add(className.FICTIVE_SLIDE);
    lastSlideClone.classList.add(className.FICTIVE_SLIDE);

    this.track.prepend(lastSlideClone);
    this.track.append(firstSlideClone);
  }

  setSlideWidth() {
    const width = this.track.offsetWidth;
    Array.from(this.allSlides).forEach((slide) => {
      slide.style.width = `${width}px`;
    });
  }

  initDots() {
    for (let i = 0; i < this.len; i += 1) {
      const dot = document.createElement('li');
      dot.setAttribute('data-slide-index', i);
      dot.className = className.DOT;
      this.dotList.append(dot);
    }

    this.dots = this.dotList.children;
  }

  setState(fields) {
    this.state = { ...this.state, ...fields };
  }
}

Slider.init(document.querySelector('.slider'));
