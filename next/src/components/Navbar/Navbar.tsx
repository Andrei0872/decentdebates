import navStyles from './Navbar.module.scss';

interface Props {
  user?: any;
}

function Navbar (props: Props) {
  const { user } = props;
  
  return (
    <ul className={navStyles.navbar}>
      <li>Debates</li>
      <li>About</li>
      <li>Contribute</li>
    </ul>
  )
}

export default Navbar