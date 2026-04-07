import ProjectDetails from '../../../../../components/Project/ProjectDetails';

export default function Page({ searchParams }) {
  const id = searchParams?.id || null;
  return <ProjectDetails id={id} />;
}
