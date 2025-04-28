
// import React, { useEffect } from 'react';
// import ECommerce from "@/components/Dashboard/E-commerce";
// import { Metadata } from "next";
// import DefaultLayout from "@/components/Layouts/DefaultLayout";

// export const metadata: Metadata = {
//   title: "REPLUS | QUALITY CHECK ",
//   description: "This is Next.js Home for TailAdmin Dashboard Template",
// };

// export default function Home() {
//   // useEffect(() => {
//   //   document.title = "REPLUS | QUALITY CHECK";
//   // }, []);

//   return (
//     <DefaultLayout><>
//     </>
//       <ECommerce />
//     </DefaultLayout>
//   );
// }

import React, { useEffect } from 'react';
// import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import SignIn from './auth/signin/page';
// import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title: "REPLUS | QUALITY CHECK ",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default function Home() {
  // useEffect(() => {
  //   document.title = "REPLUS | QUALITY CHECK";
  // }, []);

  return (

    <>
    <SignIn/>
    </>
    // <DefaultLayout><>
    // </>
    //   <ECommerce />
    // </DefaultLayout>
  );
}