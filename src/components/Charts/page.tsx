'use client'

import React, { useEffect } from 'react';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TableThree from "../Tables/TableThree";

const Chart: React.FC = () => {
  useEffect(() => {
    document.title = "TACO | QUALITY CHECK";
  }, []);

  return (
    <>
      {/* <Breadcrumb pageName="Chart" /> */}

      <div className="grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5">
        <div className="col-span-12">
          <TableThree />
        </div>
      </div>
    </>
  );
};

export default Chart;
