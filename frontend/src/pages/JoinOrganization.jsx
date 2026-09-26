import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/**
 * Legacy Join Organization component.
 * Redirects to the unified /signup?org=... page.
 */
const JoinOrganization = () => {
  const { orgSlug } = useParams();
  return (
    <Navigate
      to={orgSlug ? `/signup?org=${encodeURIComponent(orgSlug)}` : '/signup?org=lookup'}
      replace
    />
  );
};

export default JoinOrganization;
