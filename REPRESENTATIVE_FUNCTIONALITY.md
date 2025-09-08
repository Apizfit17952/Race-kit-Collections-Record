# Representative Functionality Implementation

## Overview

The representative functionality allows **someone else to collect race kits on behalf of runners**. This is essential for marathon events where runners might not be able to collect their kits personally due to travel, work, or other commitments.

## 🏗️ **Database Structure**

### Tables Involved

#### 1. **`representatives` Table**
```sql
CREATE TABLE public.representatives (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,           -- Representative's full name
  id_number TEXT NOT NULL,           -- ID number (IC, passport, etc.)
  id_type TEXT DEFAULT 'ic',         -- Type: 'ic', 'passport', 'driving_license'
  phone TEXT,                        -- Contact phone number
  relationship TEXT,                 -- Relationship to runner (e.g., "spouse", "friend")
  created_at TIMESTAMP
);
```

#### 2. **`kit_collections` Table**
```sql
CREATE TABLE public.kit_collections (
  id UUID PRIMARY KEY,
  race_kit_id UUID REFERENCES race_kits(id),
  collected_by_user_id UUID REFERENCES auth.users(id),  -- Staff member who processed
  representative_id UUID REFERENCES representatives(id), -- NULL for self-collection
  collection_type TEXT DEFAULT 'self',                   -- 'self' or 'representative'
  notes TEXT,                                            -- Additional notes
  collected_at TIMESTAMP
);
```

## 🎯 **Frontend Implementation**

### 1. **RepresentativeManager Component**

**Location**: `src/components/RepresentativeManager.tsx`

**Features**:
- ✅ **Create Representatives**: Add new people who can collect kits
- ✅ **Edit Representatives**: Update existing representative information
- ✅ **Delete Representatives**: Remove representatives from the system
- ✅ **Search Representatives**: Find representatives by name, ID, or relationship
- ✅ **Form Validation**: Required fields validation
- ✅ **ID Type Selection**: Support for IC, Passport, Driving License

**Key Functions**:
```typescript
- fetchRepresentatives()     // Load all representatives
- handleSubmit()            // Create/update representative
- handleEdit()              // Edit existing representative
- handleDelete()            // Delete representative
```

### 2. **Enhanced KitCollector Component**

**Location**: `src/components/KitCollector.tsx`

**New Features**:
- ✅ **Collection Type Selection**: Choose between self or representative collection
- ✅ **Representative Selection**: Pick from existing representatives or create new
- ✅ **Inline Representative Creation**: Create new representatives during collection
- ✅ **Collection Notes**: Add optional notes about the collection
- ✅ **Comprehensive Dialog**: Full collection workflow in a modal

**Key Functions**:
```typescript
- openCollectionDialog()    // Open collection dialog
- collectKit()             // Process kit collection
- fetchRepresentatives()   // Load representatives for selection
```

### 3. **Updated Dashboard**

**Location**: `src/components/Dashboard.tsx`

**New Features**:
- ✅ **Representatives Card**: Direct access to representative management
- ✅ **Updated Navigation**: Three main sections: Runners, Kit Collection, Representatives

## 🔄 **Complete Workflow**

### **Scenario 1: Self Collection**
1. User clicks "Collect Kit" on a pending race kit
2. Collection dialog opens with "Self Collection" selected by default
3. User can add optional notes
4. User clicks "Collect Kit" to complete the process
5. Kit status automatically changes to "collected"

### **Scenario 2: Representative Collection (Existing Representative)**
1. User clicks "Collect Kit" on a pending race kit
2. Collection dialog opens
3. User selects "Representative Collection"
4. User selects an existing representative from the dropdown
5. User can add optional notes
6. User clicks "Collect Kit" to complete the process
7. Kit status automatically changes to "collected"

### **Scenario 3: Representative Collection (New Representative)**
1. User clicks "Collect Kit" on a pending race kit
2. Collection dialog opens
3. User selects "Representative Collection"
4. User selects "+ Create New Representative"
5. User fills in representative details:
   - Full Name (required)
   - ID Number (required)
   - ID Type (IC, Passport, Driving License)
   - Phone Number (optional)
   - Relationship to Runner (optional)
6. User can add optional notes
7. User clicks "Collect Kit" to complete the process
8. New representative is created and linked to the collection
9. Kit status automatically changes to "collected"

## 🎨 **User Interface**

### **Representative Management Page**
- **Header**: Title, description, and "Add Representative" button
- **Search Bar**: Filter representatives by name, ID, or relationship
- **Representative Cards**: Display representative information with edit/delete actions
- **Add/Edit Dialog**: Form for creating or updating representatives

### **Kit Collection Dialog**
- **Collection Type**: Radio buttons for self vs representative collection
- **Representative Selection**: Dropdown with existing representatives + "Create New" option
- **New Representative Form**: Inline form for creating representatives during collection
- **Notes Field**: Optional textarea for additional information
- **Action Buttons**: Cancel and Collect Kit buttons

## 🔐 **Security & Permissions**

### **Row Level Security (RLS)**
- ✅ **View Representatives**: All authenticated users can view representatives
- ✅ **Create Representatives**: All authenticated users can create representatives
- ✅ **View Kit Collections**: All authenticated users can view collection records
- ✅ **Create Kit Collections**: All authenticated users can create collection records

### **Data Validation**
- ✅ **Required Fields**: Full name and ID number are required for representatives
- ✅ **ID Type Validation**: Only valid ID types (ic, passport, driving_license) allowed
- ✅ **Form Validation**: Client-side validation before submission
- ✅ **Error Handling**: Comprehensive error messages for failed operations

## 📊 **Database Triggers**

### **Automatic Status Update**
```sql
-- When a kit_collections record is inserted, automatically update race_kit status
CREATE TRIGGER update_kit_status_after_collection
  AFTER INSERT ON public.kit_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kit_status_on_collection();
```

This ensures that when any collection (self or representative) is recorded, the race kit status automatically changes from 'pending' to 'collected'.

## 🚀 **How to Use**

### **For Race Organizers**

1. **Set Up Representatives**:
   - Go to Dashboard → Representatives
   - Click "Add Representative"
   - Fill in representative details
   - Save the representative

2. **Process Kit Collections**:
   - Go to Dashboard → Kit Collection
   - Find the kit to collect
   - Click "Collect Kit"
   - Choose collection type (self or representative)
   - If representative: select existing or create new
   - Add notes if needed
   - Click "Collect Kit"

### **For Staff Members**

1. **Self Collection**:
   - Verify runner's identity
   - Click "Collect Kit" → "Self Collection"
   - Add any notes
   - Complete collection

2. **Representative Collection**:
   - Verify representative's identity and authorization
   - Click "Collect Kit" → "Representative Collection"
   - Select or create representative
   - Add notes about the collection
   - Complete collection

## 🔍 **Data Tracking**

### **Collection Records**
Every kit collection creates a record in `kit_collections` with:
- **race_kit_id**: Which kit was collected
- **collected_by_user_id**: Which staff member processed the collection
- **representative_id**: Which representative collected (NULL for self)
- **collection_type**: 'self' or 'representative'
- **notes**: Any additional information
- **collected_at**: Timestamp of collection

### **Audit Trail**
The system maintains a complete audit trail:
- Who collected the kit (staff member)
- When it was collected (timestamp)
- How it was collected (self or representative)
- Who collected it (runner or representative details)
- Any additional notes

## 🎯 **Benefits**

1. **Flexibility**: Runners don't need to be present to collect their kits
2. **Security**: Proper verification and logging of all collections
3. **Efficiency**: Staff can process collections quickly with guided workflow
4. **Accountability**: Complete audit trail for all collections
5. **User-Friendly**: Intuitive interface for both staff and organizers
6. **Scalable**: Can handle large numbers of representatives and collections

## 🧪 **Testing**

### **Test Scenarios**

1. **Create Representative**:
   - Add representative with all fields
   - Add representative with minimal fields
   - Try to add duplicate ID numbers

2. **Edit Representative**:
   - Update representative information
   - Change ID type and number

3. **Delete Representative**:
   - Delete representative
   - Try to delete representative with existing collections

4. **Self Collection**:
   - Collect kit as self
   - Add notes during collection

5. **Representative Collection**:
   - Collect kit using existing representative
   - Collect kit by creating new representative
   - Verify collection records are created correctly

6. **Search and Filter**:
   - Search representatives by name
   - Search representatives by ID number
   - Search representatives by relationship

## 📝 **Future Enhancements**

Potential improvements for the representative functionality:

1. **Bulk Representative Import**: CSV upload for multiple representatives
2. **Representative Authorization**: Email/SMS verification for representatives
3. **Collection Limits**: Limit number of kits a representative can collect
4. **Photo Verification**: Upload photos for representative verification
5. **Collection Scheduling**: Schedule collection times for representatives
6. **Representative Reports**: Generate reports on representative collections
7. **Mobile App**: Mobile interface for kit collection
8. **QR Code Verification**: QR codes for quick representative verification

## 🎉 **Summary**

The representative functionality is now fully implemented with:

- ✅ **Complete Database Structure**: Representatives and kit collections tables
- ✅ **Full Frontend Implementation**: Representative management and collection dialogs
- ✅ **Comprehensive Workflow**: Self and representative collection options
- ✅ **Security & Validation**: Proper RLS policies and form validation
- ✅ **User-Friendly Interface**: Intuitive design for easy use
- ✅ **Audit Trail**: Complete tracking of all collections
- ✅ **Integration**: Seamlessly integrated with existing kit management system

The system is ready for production use and can handle both self-collection and representative collection scenarios efficiently and securely.





