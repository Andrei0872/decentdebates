import { Icon } from '@blueprintjs/core'
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import styles from './CardSlider.module.scss'

interface Props {
  children: ReactNode
}

function CardSlider(props: Props) {
  const [sliderIdx, setSliderIdx] = useState(0);

  const sliderContainerRef = useRef<HTMLDivElement | null>(null);
  const cardsContainerRef = useRef<HTMLUListElement | null>(null);

  // Smaller window scroll.
  // const slidesCount = sliderContainerRef.current ? Math.floor((cardsContainerRef.current!.scrollWidth) / (sliderContainerRef.current.offsetWidth - 400)) : 1;
  // const scrollAmount = sliderContainerRef.current ? sliderContainerRef.current.offsetWidth - 400 : 0;

  const slidesCount = sliderContainerRef.current ? Math.ceil((cardsContainerRef.current!.scrollWidth) / sliderContainerRef.current.clientWidth) : 1;
  const scrollAmount = sliderContainerRef.current ? sliderContainerRef.current.offsetWidth : 0;

  const goNextSlide = () => {
    setSliderIdx(sliderIdx + 1);
    cardsContainerRef.current!.scrollLeft += scrollAmount;
  }

  const goPrevSlide = () => {
    setSliderIdx(sliderIdx - 1);
    cardsContainerRef.current!.scrollLeft -= scrollAmount;
  }

  const canSlideNext = sliderIdx < slidesCount - 1;
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
        className={`${styles.cardButton} ${styles.buttonPrev}`}
      >
        <Icon icon="chevron-left" />
      </button>
      <button
        disabled={!canSlideNext}
        onClick={goNextSlide}
        type='button'
        className={`${styles.cardButton} ${styles.buttonNext}`}
      >
        <Icon icon="chevron-right" />
      </button>
    </div>
  )
}

export default CardSlider