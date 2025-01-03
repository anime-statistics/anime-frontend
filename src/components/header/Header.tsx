
import { Navbar } from 'react-bootstrap';


export interface HeaderProps
{
	setShow : () => void;
}

export function Header ({ setShow }: HeaderProps)
{
	return (
		<Navbar as='header' expand='md' className='p-2'>
			<Navbar.Brand>Anime Statistics</Navbar.Brand>
			<Navbar.Toggle onClick={setShow} />
		</Navbar>
	);
}
