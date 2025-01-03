
import { useState } from 'react';
import { Row, Col } from 'react-bootstrap';

import { Header } from '../header/Header';
import { Sidebar } from '../sidebar/Sidebar';


export interface FoundationProps
{
	children ?: JSX.Element;
}

export function Foundation ({ children }: FoundationProps)
{
	const [ visibility, setVisibility ] = useState(false);

	const setShow = () => setVisibility(true);
	const setHide = () => setVisibility(false);

	return (
		<>
			<Header {...{setShow}} />

			<Row className='p-2 bg-light'>
				<Col xs='12' md={ children && '3' }>
					<Sidebar show={visibility} {...{setHide}} />
				</Col>

				{ children && (
					<>
						<Col xs='12' md='9'>
							<main className='p-2 bg-white rounded'>
								{ children }
							</main>
						</Col>
					</>
				) }
			</Row>
		</>
	);
}
