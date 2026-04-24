import { Icon } from '@blueprintjs/core'
import React, { ReactNode, useEffect, useRef, useState } from 'react'
import styles from './CardSlider.module.scss'
import buttonStyles from '@/styles/shared/button.module.scss'

interface Props {
  children: ReactNode
}

function CardSlider(props: Props) {
  const [sliderIdx, setSliderIdx] = useState(0);
  const [sliderMetrics, setSliderMetrics] = useState({ slidesCount: 1, scrollAmount: 0 });

  const sliderContainerRef = useRef<HTMLDivElement | null>(null);
  const cardsContainerRef = useRef<HTMLUListElement | null>(null);

  // Smaller window scroll.
  // const slidesCount = sliderContainerRef.current ? Math.floor((cardsContainerRef.current!.scrollWidth) / (sliderContainerRef.current.offsetWidth - 400)) : 1;
  // const scrollAmount = sliderContainerRef.current ? sliderContainerRef.current.offsetWidth - 400 : 0;

  useEffect(() => {
    const updateSliderMetrics = () => {
      const sliderContainer = sliderContainerRef.current;
      const cardsContainer = cardsContainerRef.current;

      if (!sliderContainer || !cardsContainer) {
        setSliderMetrics({ slidesCount: 1, scrollAmount: 0 });
        return;
      }

      const scrollAmount = sliderContainer.offsetWidth;
      const slidesCount = Math.max(1, Math.ceil(cardsContainer.scrollWidth / sliderContainer.clientWidth));
      setSliderMetrics({ slidesCount, scrollAmount });
    };

    updateSliderMetrics();
    window.addEventListener('resize', updateSliderMetrics);

    return () => {
      window.removeEventListener('resize', updateSliderMetrics);
    };
  }, [props.children]);

  const goNextSlide = () => {
    setSliderIdx(sliderIdx + 1);
    if (cardsContainerRef.current) {
      cardsContainerRef.current.scrollLeft += sliderMetrics.scrollAmount;
    }
  }

  const goPrevSlide = () => {
    setSliderIdx(sliderIdx - 1);
    if (cardsContainerRef.current) {
      cardsContainerRef.current.scrollLeft -= sliderMetrics.scrollAmount;
    }
  }

  const canSlideNext = sliderIdx < sliderMetrics.slidesCount - 1;
  const canSlidePrev = sliderIdx >= 1;

  return (
    <div ref={sliderContainerRef} className={styles.container}>
      <ul ref={cardsContainerRef} className={styles.cards}>
        {React.Children.map(props.children, elem => {
          return (
            <li className={styles.card}>
              {elem}
            </li>
          )
        })}
      </ul>

      <button
        disabled={!canSlidePrev}
        onClick={goPrevSlide}
        type='button'
        className={`${styles.cardButton} ${styles.buttonPrev} ${buttonStyles.button} ${buttonStyles.secondary}`}
      >
        <Icon icon="chevron-left" />
      </button>
      <button
        disabled={!canSlideNext}
        onClick={goNextSlide}
        type='button'
        className={`${styles.cardButton} ${styles.buttonNext} ${buttonStyles.button} ${buttonStyles.secondary}`}
      >
        <Icon icon="chevron-right" />
      </button>
    </div>
  )
}

export default CardSlider
