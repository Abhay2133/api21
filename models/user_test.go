package models

func (ms *ModelSuite) Test_User() {
	count, err := ms.DB.Count("users")
	ms.NoError(err)
	ms.Equal(0, count)

	u := &User{
		Name:  "Abhay Bisht",
		Email: "abhay@example.com",
	}

	verrs, err := ms.DB.ValidateAndCreate(u)
	ms.NoError(err)
	ms.False(verrs.HasAny())

	count, err = ms.DB.Count("users")
	ms.NoError(err)
	ms.Equal(1, count)
}
