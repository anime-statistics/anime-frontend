
import { BrowserRouter } from 'react-router-dom';

import { AllRoutes } from './routes/AllRoutes';


export function App ()
{
	return (
		<BrowserRouter>
			<AllRoutes />
		</BrowserRouter>
	);
}
