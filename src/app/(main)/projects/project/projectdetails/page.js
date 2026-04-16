import ProjectDetails from '../../../../../components/Project/ProjectDetails';

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const id = params?.id || null;
  return <ProjectDetails id={id} />;
}
