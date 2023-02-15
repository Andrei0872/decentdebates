import { GetServerSideProps } from "next";

function Debates () {
  return (
    <div>debates-feed</div>
  )
}

export default Debates;

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {},
  }
}