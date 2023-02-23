import { useRouter } from 'next/router'

function Debate() {
  const router = useRouter()
  const { id } = router.query

  console.log(id, router.isReady);

  return (
    <div>a</div>
  )
}

export default Debate;