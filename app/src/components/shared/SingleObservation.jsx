/** A single genuine datum, deliberately without a connecting price path. */
export function SingleObservation({date,valueLabel}){
 return <figure className="single-observation" aria-label={'One recorded observation on '+date+': '+valueLabel}>
  <span aria-hidden="true" className="single-observation-dot"/>
  <figcaption><strong>{valueLabel}</strong><time dateTime={date}>{date}</time><small>One recorded observation · no trend implied</small></figcaption>
 </figure>;
}
