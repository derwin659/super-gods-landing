const API_BASE_URL=import.meta.env.VITE_API_BASE_URL||import.meta.env.VITE_BACKEND_URL||"https://gods-saas-backend-production.up.railway.app";
export async function getPublicFeaturedCustomers(){
 const response=await fetch(`${API_BASE_URL}/api/public/featured-customers`);
 if(!response.ok)throw new Error('No se pudieron cargar los clientes destacados');
 return response.json();
}