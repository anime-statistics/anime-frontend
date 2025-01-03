
import { OffcanvasProps, Offcanvas } from 'react-bootstrap';

import { Navigation } from './Navigation';


export interface SidebarProps extends Pick<OffcanvasProps, 'show'>
{
	setHide : () => void;
}

export function Sidebar ({ setHide, show }: SidebarProps)
{
	return (
		<Offcanvas as='aside' onHide={setHide} responsive='md' {...{show}}>
			<Offcanvas.Header closeButton>
				<Offcanvas.Title>Anime Statistics</Offcanvas.Title>
			</Offcanvas.Header>

			<Offcanvas.Body>
				<Navigation />
			</Offcanvas.Body>
		</Offcanvas>
	);
}
