const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/User";

export async function getCurrentUser() {
  try {
    // const res = await fetch(API_BASE_URL, {
    //   method: 'GET',
    //   headers: { Accept: '*/*' },
    // });
    // const json = await res.json();
    // return { data: json && json.value ? json.value : json, error: null };
      return {data: {error:null,isFailure:false,isSuccess:true,value:
        {id:1,code:'001',name:'Oliver',email:'oliver@email.com'}
      }}
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}

export async function getUserAccess() {
    const access = [{
        name: 'Dashboard',
        access:'rwa'
      },
      {
        name: 'Customers',
         access:'rwa'
      },
      {
        name: 'Suppliers',
         access:'rwa'
      },
      {
        name: 'Inquiry',
         access:'rwa'
      },
      { name: 'Projects',
         access:'rwa'
      },   
          {
            name: 'Projects.Proposal',
             access:'rwa'
          },
          {
            name: 'Projects.Projects',
             access:'rwa'
          },
          {
            name: 'Projects.MaterialRequests',
             access:'rwa'
          },
          {
            name: 'Projects.Billings',
             access:'rwa'
          },
          {
            name: 'Projects.Collections',
             access:'rwa'
          },
      {
        name: 'Purchase',
         access:'rwa'
      },
        {
            name: 'Purchase.Requests',
            access:'rwa'
          },
          {
            name: 'Purchase.Orders',
            access:'rwa'
          },
          {
            name: 'Purchase.Deliveries',
            access:'rwa'
          },
          {
            name: 'Purchase.Invoices',
            access:'rwa'
          },
          {
            name: 'Purchase.Payments',
            access:'rwa'
          },
    {
        name: 'Finance',
         access:'rwa'
      },
     {
        name: 'Finance.Billings',
         access:'rwa'
      },
     {
        name: 'Finance.Invoices',
         access:'rwa'
      },
     {
        name: 'Finance.Collections',
         access:'rwa'
      },
     {
        name: 'Finance.Payments',
         access:'rwa'
      },
      {
        name: 'Storage',
        access:'n'
      },
          {

            name: 'Storage.Warehouse',
            access:'rwa'
          },
          {
            name: 'Storage.Rack',
            access:'rwa'
          },
      {
        name: 'Materials',
        access:'rwa'
      },
          {
            name: 'Materials.Materials',
            access:'rwa'
          },
            {
              name: 'Materials.ToolsEquipment',
              access:'rwa'
            },
          {
            name: 'Materials.Assembly',
            access:'rwa'
          },
      {
        name: 'Inventory',
        access:'rwa'
      },
          {
            name: 'Inventory.MaterialInventory',
            access:'rwa'
          },
          {
            name: 'Inventory.ToolsInventory',
            access:'rwa'
          },
      {
        name: 'Employees',
        access:'rwa'
      },
      {
        name: 'Employees.Staff',
        access:'rwa'
      },
      {
        name: 'Employees.Maintenance',
        access:'rwa'
      }];

  try {
    // const res = await fetch(API_BASE_URL, {
    //   method: 'GET',
    //   headers: { Accept: '*/*' },
    // });
    // const json = await res.json();
    // return { data: json && json.value ? json.value : json, error: null };
      return {data: {error:null,isFailure:false,isSuccess:true,
        value:[...access]
      }}
  } catch (error) {
    return { data: null, error: error?.message || error };
  }
}
